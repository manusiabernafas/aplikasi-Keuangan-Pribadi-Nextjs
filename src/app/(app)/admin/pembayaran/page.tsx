import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { TZ } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { expireStalePayments } from "@/lib/server/billing";

export const metadata: Metadata = { title: "Pembayaran · Admin" };
const STATUS = { paid: "bg-income-soft text-income", pending: "bg-caramel-soft text-[#9a5f22]", failed: "bg-expense-soft text-expense", expired: "bg-latte-2 text-muted" } as const;
const LABEL = { paid: "Lunas", pending: "Menunggu", failed: "Gagal", expired: "Kedaluwarsa" } as const;
const fmt = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function AdminPayments({ searchParams }: PageProps<"/admin/pembayaran">) {
  await requireSuperAdmin();
  await expireStalePayments();
  const status = z.enum(["paid", "pending", "failed", "expired"]).optional().catch(undefined).parse((await searchParams).status);
  const rows = await db
    .select({ p: schema.payments, email: schema.users.email })
    .from(schema.payments)
    .innerJoin(schema.users, eq(schema.users.id, schema.payments.userId))
    .where(status ? eq(schema.payments.status, status) : undefined)
    .orderBy(desc(schema.payments.createdAt))
    .limit(200);
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[undefined, "paid", "pending", "failed", "expired"].map((s) => (
          <Link key={s ?? "all"} href={s ? `?status=${s}` : "?"} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${status === s ? "bg-mocha text-white" : "border border-line bg-card text-muted"}`}>
            {s ? LABEL[s as keyof typeof LABEL] : "Semua"}
          </Link>
        ))}
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-cream-2 text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Waktu (WIB)</th>
              <th className="px-4 py-3 font-semibold">Invoice</th>
              <th className="px-4 py-3 font-semibold">Pengguna</th>
              <th className="px-4 py-3 font-semibold">Nominal</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ p, email }) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-muted">{fmt(p.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink">{p.invoiceNumber}{p.paymentMethod ? <span className="block text-muted">{p.paymentMethod}</span> : null}</td>
                <td className="px-4 py-3 text-ink">{email}</td>
                <td className="px-4 py-3 font-bold text-ink tabular-nums">{formatRupiah(p.amount)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[p.status]}`}>{LABEL[p.status]}</span></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Belum ada pembayaran.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
