"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth/session";
import { audit } from "@/lib/server/audit";
import { parseRupiah } from "@/lib/money";
import { cleanText, fieldErrors } from "@/lib/validation/forms";
import { ActionError, run, type ActionState } from "./common";

const limit = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().min(0, "Tidak boleh negatif").max(10000).nullable());

const planSchema = z.object({
  id: z.uuid(),
  name: cleanText(40, "Nama paket").pipe(z.string().min(1, "Nama paket perlu diisi")),
  description: cleanText(200, "Deskripsi"),
  price: z.string().transform((s, ctx) => {
    const v = parseRupiah(s || "0");
    if (v === null) {
      ctx.addIssue({ code: "custom", message: "Harga belum terbaca" });
      return z.NEVER;
    }
    return v;
  }),
  periodDays: z.coerce.number().int().min(0).max(366),
  maxWallets: limit,
  maxGoals: limit,
  maxCategories: limit,
});

export async function savePlan(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const admin = await requireSuperAdmin();
    const o = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
    const parsed = planSchema.safeParse(o);
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const plan = await db.query.plans.findFirst({ where: eq(schema.plans.id, v.id) });
    if (!plan) throw new ActionError("Paket tidak ditemukan.");
    if (plan.code === "premium" && v.price > 0 && v.price < 1000) return { ok: false, errors: { price: "Harga minimal Rp 1.000 (batas DOKU)." } };
    if (plan.code === "premium" && v.periodDays < 1) return { ok: false, errors: { periodDays: "Durasi minimal 1 hari." } };
    const features = {
      maxWallets: v.maxWallets,
      maxGoals: v.maxGoals,
      maxCategories: v.maxCategories,
      partner: form.get("partner") === "on",
      bills: form.get("bills") === "on",
      export: form.get("export") === "on",
      fullReports: form.get("fullReports") === "on",
    };
    await db
      .update(schema.plans)
      .set({ name: v.name, description: v.description || null, price: plan.code === "free" ? 0 : v.price, periodDays: plan.code === "free" ? 0 : v.periodDays, features, active: plan.code === "free" ? true : form.get("active") === "on", updatedAt: new Date() })
      .where(eq(schema.plans.id, plan.id));
    await audit(admin.id, "admin.plan.update", plan.code, { price: v.price, periodDays: v.periodDays, features });
    revalidatePath("/", "layout");
    return { ok: true, message: `Paket ${v.name} disimpan. Harga baru berlaku untuk pembayaran berikutnya.` };
  });
}

export async function setUserBanned(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const admin = await requireSuperAdmin();
    const id = z.uuid().parse(form.get("id"));
    const banned = form.get("banned") === "1";
    if (id === admin.id) throw new ActionError("Tidak bisa memblokir akun sendiri.");
    const u = await db.query.users.findFirst({ where: eq(schema.users.id, id) });
    if (!u) throw new ActionError("Pengguna tidak ditemukan.");
    if (u.role === "super_admin") throw new ActionError("Super admin tidak bisa diblokir dari panel.");
    await db.update(schema.users).set({ banned, updatedAt: new Date() }).where(eq(schema.users.id, id));
    if (banned) await db.delete(schema.sessions).where(eq(schema.sessions.userId, id)); // paksa keluar
    await audit(admin.id, banned ? "admin.user.ban" : "admin.user.unban", id);
    revalidatePath("/admin", "layout");
    return { ok: true, message: banned ? `${u.email} diblokir dan dikeluarkan dari semua perangkat.` : `${u.email} diaktifkan lagi.` };
  });
}

/** Beri / tambah masa Premium manual (mis. promo atau kompensasi) */
export async function grantPremium(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const admin = await requireSuperAdmin();
    const id = z.uuid().parse(form.get("id"));
    const days = z.coerce.number().int().min(-366).max(366).refine((d) => d !== 0, "Isi jumlah hari").safeParse(form.get("days"));
    if (!days.success) return { ok: false, errors: { days: "Isi jumlah hari antara -366 dan 366 (bukan 0)." } };
    const premium = await db.query.plans.findFirst({ where: eq(schema.plans.code, "premium") });
    if (!premium) throw new ActionError("Paket Premium tidak ada.");
    const now = new Date();
    const sub = await db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.userId, id) });
    const base = sub && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
    const end = new Date(base.getTime() + days.data * 86_400_000);
    await db
      .insert(schema.subscriptions)
      .values({ userId: id, planId: premium.id, currentPeriodEnd: end })
      .onConflictDoUpdate({ target: schema.subscriptions.userId, set: { planId: premium.id, currentPeriodEnd: end, updatedAt: now } });
    await audit(admin.id, "admin.premium.grant", id, { days: days.data, until: end.toISOString() });
    revalidatePath("/admin", "layout");
    return { ok: true, message: days.data > 0 ? `Premium ditambah ${days.data} hari.` : `Premium dikurangi ${-days.data} hari.` };
  });
}

export async function countUsers() {
  await requireSuperAdmin();
  const [r] = await db.select({ c: sql<string>`count(*)` }).from(schema.users);
  return Number(r.c);
}
