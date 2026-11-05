import type { Metadata } from "next";
import { and, eq, gt, gte, sql } from "drizzle-orm";
import { Card, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/charts/charts";
import { requireSuperAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { addMonthsISO, monthLabel, monthStart, todayISO } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { expireStalePayments } from "@/lib/server/billing";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHome() {
  await requireSuperAdmin();
  await expireStalePayments();
  const today = todayISO();
  const ms = new Date(`${monthStart(today)}T00:00:00+07:00`);
  const from6 = new Date(`${addMonthsISO(monthStart(today), -5)}T00:00:00+07:00`);
  const n = (v: unknown) => Number(v ?? 0);
  const [[users], [newUsers], [premium], [revMonth], [revAll], [pending], [txCount], series] = await Promise.all([
    db.select({ c: sql`count(*)` }).from(schema.users),
    db.select({ c: sql`count(*)` }).from(schema.users).where(gte(schema.users.createdAt, ms)),
    db.select({ c: sql`count(*)` }).from(schema.subscriptions).where(gt(schema.subscriptions.currentPeriodEnd, new Date())),
    db.select({ s: sql`coalesce(sum(amount),0)`, c: sql`count(*)` }).from(schema.payments).where(and(eq(schema.payments.status, "paid"), gte(schema.payments.paidAt, ms))),
    db.select({ s: sql`coalesce(sum(amount),0)` }).from(schema.payments).where(eq(schema.payments.status, "paid")),
    db.select({ c: sql`count(*)` }).from(schema.payments).where(eq(schema.payments.status, "pending")),
    db.select({ c: sql`count(*)` }).from(schema.transactions),
    db.execute<{ m: string; users: string; revenue: string }>(sql`
      with months as (select generate_series(date_trunc('month', ${from6.toISOString()}::timestamptz at time zone 'Asia/Jakarta'), date_trunc('month', now() at time zone 'Asia/Jakarta'), interval '1 month') as m)
      select to_char(m, 'YYYY-MM-DD') as m,
        (select count(*) from users u where date_trunc('month', u.created_at at time zone 'Asia/Jakarta') = m) as users,
        (select coalesce(sum(p.amount),0) from payments p where p.status = 'paid' and date_trunc('month', p.paid_at at time zone 'Asia/Jakarta') = m) as revenue
      from months order by m`),
  ]);
  const stats = [
    { l: "Total pengguna", v: n(users.c).toLocaleString("id-ID") },
    { l: "Pengguna baru bulan ini", v: n(newUsers.c).toLocaleString("id-ID") },
    { l: "Premium aktif", v: n(premium.c).toLocaleString("id-ID") },
    { l: "Pendapatan bulan ini", v: formatRupiah(n(revMonth.s)), s: `${n(revMonth.c)} pembayaran` },
    { l: "Total pendapatan", v: formatRupiah(n(revAll.s)) },
    { l: "Pembayaran menunggu", v: n(pending.c).toLocaleString("id-ID") },
    { l: "Total transaksi dicatat", v: n(txCount.c).toLocaleString("id-ID") },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((x) => (
          <Card key={x.l} className="p-4">
            <p className="text-xs font-semibold text-muted sm:text-sm">{x.l}</p>
            <p className="mt-1 truncate font-display text-lg font-extrabold text-ink tabular-nums sm:text-2xl">{x.v}</p>
            {x.s && <p className="text-xs text-muted">{x.s}</p>}
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Pendapatan 6 bulan (lunas)</CardTitle>
          <BarChart label="Pendapatan per bulan" highlight={series.rows.length - 1} data={series.rows.map((r) => ({ label: monthLabel(r.m, true).split(" ")[0], value: n(r.revenue), title: monthLabel(r.m) }))} />
        </Card>
        <Card>
          <CardTitle>Pendaftar baru per bulan</CardTitle>
          <ul className="space-y-2">
            {series.rows.map((r) => (
              <li key={r.m} className="flex justify-between text-sm">
                <span className="text-muted">{monthLabel(r.m)}</span>
                <span className="font-bold text-ink tabular-nums">{n(r.users)} pengguna</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
