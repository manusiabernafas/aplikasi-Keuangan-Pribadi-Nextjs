import "server-only";
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { audit } from "@/lib/server/audit";
import type { DokuStatus } from "@/lib/payment/doku";

/**
 * Terapkan status pembayaran secara idempoten: pembayaran yang sudah "paid" tidak
 * diproses dua kali (baris dikunci FOR UPDATE). Saat lunas, langganan diperpanjang
 * dari tanggal berakhir saat ini (atau dari sekarang bila sudah lewat).
 */
export async function applyPaymentStatus(invoice: string, status: DokuStatus, info: { amount?: number | null; method?: string | null } = {}) {
  return db.transaction(async (tx) => {
    const [p] = await tx.select().from(schema.payments).where(eq(schema.payments.invoiceNumber, invoice)).for("update");
    if (!p) return { ok: false as const, reason: "not_found" };
    if (p.status === "paid" || status === "pending") return { ok: true as const, status: p.status };
    if (status !== "paid") {
      await tx.update(schema.payments).set({ status, updatedAt: new Date() }).where(eq(schema.payments.id, p.id));
      return { ok: true as const, status };
    }
    if (info.amount != null && info.amount !== p.amount) {
      await audit(null, "payment.amount_mismatch", p.id, { expected: p.amount, got: info.amount });
      return { ok: false as const, reason: "amount_mismatch" };
    }
    const now = new Date();
    await tx.update(schema.payments).set({ status: "paid", paidAt: now, paymentMethod: info.method ?? p.paymentMethod, updatedAt: now }).where(eq(schema.payments.id, p.id));
    const [sub] = await tx.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, p.userId)).for("update");
    const base = sub && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
    const end = new Date(base.getTime() + p.periodDays * 86_400_000);
    await tx
      .insert(schema.subscriptions)
      .values({ userId: p.userId, planId: p.planId, currentPeriodEnd: end })
      .onConflictDoUpdate({ target: schema.subscriptions.userId, set: { planId: p.planId, currentPeriodEnd: end, updatedAt: now } });
    await audit(p.userId, "subscription.paid", p.id, { invoice, until: end.toISOString() });
    return { ok: true as const, status: "paid" as const };
  });
}

/** Tandai kedaluwarsa pembayaran pending yang sudah lewat batas waktu */
export async function expireStalePayments() {
  await db.update(schema.payments).set({ status: "expired", updatedAt: new Date() }).where(and(eq(schema.payments.status, "pending"), lt(schema.payments.expiresAt, new Date())));
}
