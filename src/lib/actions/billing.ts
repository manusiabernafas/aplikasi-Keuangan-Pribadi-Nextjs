"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { devPasswordLogin, serverEnv } from "@/lib/env.server";
import { checkStatus, createCheckout, dokuConfigured } from "@/lib/payment/doku";
import { applyPaymentStatus } from "@/lib/server/billing";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ActionState } from "./common";

const DUE_MINUTES = 60;

/** Mulai bayar Premium 1 periode. Harga & durasi diambil dari paket di database (diatur super admin). */
export async function startCheckout(): Promise<ActionState> {
  const user = await requireUser();
  if (!rateLimit(`checkout:${user.id}`, 5, 300).ok) return { ok: false, message: "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi." };
  const plan = await db.query.plans.findFirst({ where: and(eq(schema.plans.code, "premium"), eq(schema.plans.active, true)) });
  if (!plan || plan.price <= 0) return { ok: false, message: "Paket Premium sedang tidak tersedia." };

  // Pakai ulang tautan pembayaran yang masih aktif agar tidak membuat tagihan dobel
  const pending = await db.query.payments.findFirst({
    where: and(eq(schema.payments.userId, user.id), eq(schema.payments.status, "pending"), eq(schema.payments.amount, plan.price), gt(schema.payments.expiresAt, new Date(Date.now() + 5 * 60_000))),
  });
  if (pending?.paymentUrl) redirect(pending.paymentUrl);

  const now = new Date();
  const invoice = `BOMA-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${randomBytes(5).toString("hex").toUpperCase()}`;
  const simulate = !dokuConfigured() && devPasswordLogin();
  if (!dokuConfigured() && !simulate) return { ok: false, message: "Pembayaran belum aktif. Silakan coba lagi nanti." };

  const [p] = await db
    .insert(schema.payments)
    .values({ userId: user.id, planId: plan.id, invoiceNumber: invoice, amount: plan.price, periodDays: plan.periodDays, expiresAt: new Date(now.getTime() + DUE_MINUTES * 60_000) })
    .returning({ id: schema.payments.id });

  const callbackUrl = `${serverEnv().APP_URL}/langganan?invoice=${invoice}`;
  if (simulate) {
    await db.update(schema.payments).set({ paymentUrl: `/langganan?invoice=${invoice}&simulasi=1` }).where(eq(schema.payments.id, p.id));
    redirect(`/langganan?invoice=${invoice}&simulasi=1`);
  }
  let url: string;
  try {
    url = await createCheckout({ invoice, amount: plan.price, name: user.name, email: user.email, callbackUrl, dueMinutes: DUE_MINUTES, itemName: `Boma ${plan.name} ${plan.periodDays} hari` });
  } catch {
    await db.update(schema.payments).set({ status: "failed" }).where(eq(schema.payments.id, p.id));
    return { ok: false, message: "Gagal membuka halaman pembayaran DOKU. Coba lagi sebentar lagi." };
  }
  await db.update(schema.payments).set({ paymentUrl: url }).where(eq(schema.payments.id, p.id));
  redirect(url);
}

/** Cek status ke DOKU (dipakai saat pengguna kembali dari halaman bayar). */
export async function refreshPayment(invoice: string) {
  const user = await requireUser();
  const p = await db.query.payments.findFirst({ where: and(eq(schema.payments.invoiceNumber, invoice), eq(schema.payments.userId, user.id)) });
  if (!p) return null;
  if (p.status === "pending" && dokuConfigured() && rateLimit(`status:${user.id}`, 20, 60).ok) {
    try {
      const s = await checkStatus(invoice);
      await applyPaymentStatus(invoice, s.status, { amount: s.amount, method: s.method });
    } catch (e) {
      console.error("[doku] cek status gagal", e);
    }
  }
  return db.query.payments.findFirst({ where: eq(schema.payments.id, p.id) });
}

/** Hanya untuk uji lokal tanpa kredensial DOKU */
export async function simulatePaid(form: FormData) {
  if (!devPasswordLogin() || dokuConfigured()) return;
  const user = await requireUser();
  const invoice = String(form.get("invoice") ?? "");
  const p = await db.query.payments.findFirst({ where: and(eq(schema.payments.invoiceNumber, invoice), eq(schema.payments.userId, user.id)) });
  if (p) await applyPaymentStatus(invoice, "paid", { amount: p.amount, method: "SIMULASI" });
  redirect(`/langganan?invoice=${invoice}`);
}
