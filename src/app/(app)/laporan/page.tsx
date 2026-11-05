import type { Metadata } from "next";
import Link from "next/link";
import { Crown } from "lucide-react";
import { MonthNav, monthFromParam } from "@/components/app/month-nav";
import { PageHeader } from "@/components/app/page-header";
import { BarChart, Donut, TrendChart } from "@/components/charts/charts";
import { CategoryIcon } from "@/components/category-icon";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { requireBook } from "@/lib/auth/session";
import { daysBetween, monthEnd, monthLabel, todayISO } from "@/lib/dates";
import { formatRupiah, formatRupiahShort } from "@/lib/money";
import { getBookEntitlement } from "@/lib/server/plans";
import { byCategory, dailyExpense, monthlyTrend, periodTotals } from "@/lib/server/queries";

export const metadata: Metadata = { title: "Laporan" };

export default async function LaporanPage({ searchParams }: PageProps<"/laporan">) {
  const { book } = await requireBook();
  const ent = await getBookEntitlement(book.ownerId);
  const today = todayISO();
  const full = ent.features.fullReports;
  const requested = monthFromParam((await searchParams).bulan);
  // Paket gratis: hanya laporan bulan berjalan
  const month = full ? requested : `${today.slice(0, 7)}-01`;
  const locked = !full && requested !== month;
  const to = month.slice(0, 7) === today.slice(0, 7) ? today : monthEnd(month);

  const [totals, expCats, incCats, daily, trend] = await Promise.all([
    periodTotals(book.id, month, monthEnd(month)),
    byCategory(book.id, "expense", month, monthEnd(month)),
    byCategory(book.id, "income", month, monthEnd(month)),
    dailyExpense(book.id, month, to),
    full ? monthlyTrend(book.id, month, 6) : Promise.resolve([]),
  ]);
  const days = daysBetween(month, to) + 1;
  const net = totals.income - totals.expense;
  const savingRate = totals.income ? Math.round((net / totals.income) * 100) : null;
  const biggestDay = daily.reduce((m, d) => (d.total > m.total ? d : m), { day: month, total: 0 });

  return (
    <div>
      <PageHeader
        title="Laporan"
        text={`Ringkasan keuangan ${monthLabel(month)}.`}
        pose="chart"
        action={full ? <MonthNav month={month} path="/laporan" /> : (
          <Link href="/langganan" className="inline-flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-2.5 text-sm font-bold text-mocha hover:border-caramel">
            <Crown className="size-4 text-caramel" /> Laporan bulan lalu & tren (Premium)
          </Link>
        )}
      />
      {locked && <p className="mb-5 rounded-2xl bg-caramel-soft px-4 py-3 text-sm font-semibold text-mocha">Laporan bulan sebelumnya tersedia di paket Premium. Menampilkan bulan berjalan.</p>}

      {totals.count === 0 ? (
        <EmptyState pose="sleep" title="Belum ada data di bulan ini" text="Laporan akan muncul setelah kamu mencatat transaksi." />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { l: "Pemasukan", v: formatRupiah(totals.income), c: "text-income" },
              { l: "Pengeluaran", v: formatRupiah(totals.expense), c: "text-expense" },
              { l: "Rata-rata keluar / hari", v: formatRupiah(Math.round(totals.expense / days)), c: "text-ink" },
              { l: "Porsi ditabung", v: savingRate === null ? "-" : `${savingRate}%`, c: savingRate !== null && savingRate < 0 ? "text-expense" : "text-mocha" },
            ].map((x) => (
              <Card key={x.l} className="p-4">
                <p className="text-xs font-semibold text-muted sm:text-sm">{x.l}</p>
                <p className={`mt-1 truncate font-display text-lg font-extrabold tabular-nums sm:text-2xl ${x.c}`}>{x.v}</p>
              </Card>
            ))}
          </div>

          <Card className={net >= 0 ? "bg-income-soft" : "bg-expense-soft"}>
            <p className="font-semibold text-ink">
              {net >= 0
                ? `Bulan ini kamu menyisakan ${formatRupiah(net)}${savingRate !== null ? ` (${savingRate}% dari pemasukan)` : ""}. ${savingRate !== null && savingRate >= 20 ? "Mantap, sudah di atas 20% yang disarankan." : "Coba targetkan menyisihkan minimal 20% pemasukan."}`
                : `Pengeluaran lebih besar ${formatRupiah(-net)} dari pemasukan. Cek kategori terbesar di bawah untuk mulai berhemat.`}
              {biggestDay.total > 0 && ` Hari paling boros: ${Number(biggestDay.day.slice(8))} ${monthLabel(month).split(" ")[0]} (${formatRupiahShort(biggestDay.total)}).`}
            </p>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardTitle>Pengeluaran per kategori</CardTitle>
              {expCats.length ? (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <Donut data={expCats.map((x) => ({ name: x.name, value: x.total, color: x.color }))} center={{ label: "Total", value: formatRupiahShort(totals.expense) }} />
                  <ul className="flex-1 space-y-3">
                    {expCats.map((x) => (
                      <li key={x.name}>
                        <div className="mb-1 flex items-center gap-2 text-sm">
                          <CategoryIcon icon={x.icon} color={x.color} size="sm" />
                          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{x.name}</span>
                          <span className="font-bold text-ink tabular-nums">{formatRupiahShort(x.total)}</span>
                        </div>
                        <Progress value={(x.total / Math.max(1, totals.expense)) * 100} tone="caramel" className="h-1.5" label={x.name} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted">Belum ada pengeluaran.</p>
              )}
            </Card>
            <Card>
              <CardTitle>Sumber pemasukan</CardTitle>
              {incCats.length ? (
                <ul className="space-y-3">
                  {incCats.map((x) => (
                    <li key={x.name} className="flex items-center gap-3 text-sm">
                      <CategoryIcon icon={x.icon} color={x.color} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{x.name}</span>
                        <span className="text-xs text-muted">{x.count} transaksi</span>
                      </span>
                      <span className="font-bold text-income tabular-nums">{formatRupiah(x.total)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Belum ada pemasukan tercatat.</p>
              )}
            </Card>
          </div>

          <Card>
            <CardTitle>Pengeluaran harian</CardTitle>
            <BarChart label="Pengeluaran harian" data={daily.map((d) => ({ label: String(Number(d.day.slice(8))), value: d.total, title: `${Number(d.day.slice(8))} ${monthLabel(month, true)}` }))} />
          </Card>

          {full && trend.length > 0 && (
            <Card>
              <CardTitle>Tren 6 bulan</CardTitle>
              <TrendChart data={trend.map((t) => ({ label: monthLabel(t.month, true).split(" ")[0], income: t.income, expense: t.expense }))} />
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
