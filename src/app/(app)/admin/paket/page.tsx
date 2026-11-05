import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Card, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { PlanForm } from "./plan-form";

export const metadata: Metadata = { title: "Paket · Admin" };

export default async function AdminPlans() {
  await requireSuperAdmin();
  const plans = await db.select().from(schema.plans).orderBy(asc(schema.plans.price));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {plans.map((p) => (
        <Card key={p.id}>
          <CardTitle>Paket {p.code === "free" ? "Gratis" : "Premium"} <span className="ml-1 text-xs font-semibold text-muted">({p.code})</span></CardTitle>
          <PlanForm plan={p} />
        </Card>
      ))}
    </div>
  );
}
