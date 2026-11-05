import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { PlanFeatures } from "@/lib/db/schema";

export type Entitlement = {
  premium: boolean;
  planName: string;
  features: PlanFeatures;
  periodEnd: Date | null;
};

const FALLBACK_FREE: PlanFeatures = { maxWallets: 2, maxGoals: 1, maxCategories: 20, partner: false, bills: false, export: false, fullReports: false };

export const getPlanByCode = cache(async (code: "free" | "premium") => {
  return db.query.plans.findFirst({ where: eq(schema.plans.code, code) });
});

/** Hak fitur sebuah akun: Premium bila langganannya masih berlaku. */
export const getUserEntitlement = cache(async (userId: string): Promise<Entitlement> => {
  const sub = await db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.userId, userId) });
  if (sub && sub.currentPeriodEnd > new Date()) {
    const plan = await db.query.plans.findFirst({ where: eq(schema.plans.id, sub.planId) });
    if (plan) return { premium: plan.code !== "free", planName: plan.name, features: plan.features, periodEnd: sub.currentPeriodEnd };
  }
  const free = await getPlanByCode("free");
  return { premium: false, planName: free?.name ?? "Gratis", features: free?.features ?? FALLBACK_FREE, periodEnd: null };
});

/** Fitur sebuah buku mengikuti paket pemilik buku (pasangan ikut menikmati Premium pemilik). */
export async function getBookEntitlement(ownerId: string) {
  return getUserEntitlement(ownerId);
}
