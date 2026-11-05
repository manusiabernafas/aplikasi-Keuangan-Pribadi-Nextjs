import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarClock, Sparkles, Wallet } from "lucide-react";
import { BomaCat } from "@/components/illustrations/boma-cat";
import { JarArt } from "@/components/illustrations/scenes";
import { BarChart, Donut } from "@/components/charts/charts";
import { CategoryIcon } from "@/components/category-icon";
import { TxList } from "@/components/app/tx-list";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { requireBook } from "@/lib/auth/session";
import { addDaysISO, addMonthsISO, daysBetween, greeting, monthEnd, monthLabel, monthStart, relativeDayLabel, todayISO } from "@/lib/dates";
import { formatRupiah, formatRupiahShort } from "@/lib/money";
import { getBookEntitlement } from "@/lib/server/plans";
import { byCategory, dailyExpense, getBills, getBudgets, getCategories, getGoals, getWallets, listTransactions, periodTotals } from "@/lib/server/queries";

export const metadata: Metadata = { title: "Dasbor" };

export default async function DashboardPage({ searchParams }: PageProps<"/dasbor">) {
  const { user, book, role } = await requireBook();
  const sp = await searchParams;
  const today = todayISO();
  const from = monthStart(today);
  const to = monthEnd(today);
  const prevFrom = addMonthsISO(from, -1);
  const prevSameDay = addDaysISO(prevFrom, daysBetween(from, today));

  const [ent, wallets, categories, totals, prevTotals, daily, cats, budgets, goals, bills, recent] = await Promise.all([
    getBookEntitlement(book.ownerId),
    getWallets(book.id),
    getCategories(book.id),
    periodTotals(book.id, from, to),
    periodTotals(book.id, prevFrom, prevSameDay),
    dailyExpense(book.id, addDaysISO(today, -13), today),
    byCategory(book.id, "expense", from, to),
    getBudgets(book.id, today),
    getGoals(book.id),
    getBills(book.id, true),
    listTransactions(book.id, {}, 1, 6),
  ]);

  const balance = wallets.reduce((s, w) => s + w.balance, 0);
  const net = totals.income - totals.expense;
  const first = user.name.split(" ")[0];
  const diff = prevTotals.expense ? Math.round(((totals.expense - prevTotals.expense) / prevTotals.expense) * 100) : null;
  const overBudget = budgets.filter((b) => b.spent > b.amount);
  const nearBudget = budgets.filter((b) => b.spent <= b.amount && b.spent >= b.amount * 0.8);
  const dueSoon = bills.filter((b) => b.nextDueOn <= addDaysISO(today, 7));
  const activeGoals = goals.filter((g) => !g.archived);
  const w = wallets.map((x) => ({ id: x.id, name: x.name, balance: x.balance }));
  const c = categories.map((x) => ({ id: x.id, name: x.name, kind: x.kind, icon: x.icon, color: x.color }));

  // Pesan Boma: satu kalimat paling berguna untuk hari ini
  const tip =
    overBudget.length > 0
      ? `Anggaran ${overBudget[0].name} sudah lewat batas. Coba rem dulu ya.`
      : dueSoon.length > 0
        ? `${dueSoon[0].name} jatuh tempo ${relativeDayLabel(dueSoon[0].nextDueOn).toLowerCase()}. Jangan sampai lupa.`
        : nearBudget.length > 0
          ? `Anggaran ${nearBudget[0].name} tinggal ${formatRupiahShort(nearBudget[0].amount - nearBudget[0].spent)}.`
          : diff !== null && diff < 0
            ? `Pengeluaranmu ${Math.abs(diff)}% lebih hemat dari periode yang sama bulan lalu. Keren!`
            : totals.count === 0
              ? "Mulai dengan mencatat satu transaksi hari ini. Sedikit-sedikit lama-lama jadi rapi."
              : "Catatanmu rapi. Terus pertahankan kebiasaan baik ini!";

  return (
    <div className="space-y-6">
      {sp.bergabung && (
        <p className="rounded-2xl bg-income-soft px-4 py-3 font-semibold text-income">Kamu sekarang mengelola {book.name} bersama pasanganmu.</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-mocha-soft p-6 sm:p-7">
          <p className="font-semibold text-muted">
            {greeting()}, {first}!
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">Total saldomu</h1>
          <p className="mt-2 font-display text-4xl font-extrabold text-mocha tabular-nums sm:text-5xl">{formatRupiah(balance)}</p>
          <div className="relative z-10 mt-5 max-w-[calc(100%-7rem)] rounded-2xl bg-card/80 px-4 py-3 text-sm font-semibold text-ink sm:max-w-sm">
            <Sparkles className="mr-1.5 inline size-4 text-caramel" />
            {tip}
          </div>
          <BomaCat pose={totals.count === 0 ? "wave" : net >= 0 ? "coin" : "think"} className="absolute -right-4 -bottom-5 w-36 sm:w-48" title="Boma" />
        </section>

        {/* Ringkasan bulan */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-income-soft text-income"><ArrowDownLeft className="size-5" /></span>
            <div className="mt-3">
              <p className="text-sm font-semibold text-muted">Pemasukan</p>
              <p className="font-display text-xl font-extrabold text-ink tabular-nums">{formatRupiahShort(totals.income)}</p>
            </div>
          </Card>
          <Card className="flex flex-col justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-expense-soft text-expense"><ArrowUpRight className="size-5" /></span>
            <div className="mt-3">
              <p className="text-sm font-semibold text-muted">Pengeluaran</p>
              <p className="font-display text-xl font-extrabold text-ink tabular-nums">{formatRupiahShort(totals.expense)}</p>
            </div>
          </Card>
          <Card className="col-span-2 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-muted">Selisih {monthLabel(today)}</p>
              <p className={`font-display text-2xl font-extrabold tabular-nums ${net >= 0 ? "text-income" : "text-expense"}`}>{formatRupiah(net, { sign: true })}</p>
              {diff !== null && (
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  Pengeluaran {diff <= 0 ? `${Math.abs(diff)}% lebih hemat` : `${diff}% lebih boros`} dari bulan lalu
                </p>
              )}
            </div>
            <JarArt className="w-20 shrink-0" />
          </Card>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardTitle action={<Link href="/laporan" className="text-sm font-bold text-mocha hover:underline">Laporan</Link>}>Pengeluaran 14 hari terakhir</CardTitle>
          <BarChart
            label="Pengeluaran 14 hari terakhir"
            data={daily.map((d) => ({ label: String(Number(d.day.slice(8))), value: d.total, title: relativeDayLabel(d.day) }))}
          />
        </Card>
        <Card>
          <CardTitle>Ke mana uangmu pergi</CardTitle>
          {cats.length ? (
            <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
              <Donut data={cats.slice(0, 6).map((x) => ({ name: x.name, value: x.total, color: x.color }))} center={{ label: "Bulan ini", value: formatRupiahShort(totals.expense) }} />
              <ul className="w-full flex-1 space-y-2">
                {cats.slice(0, 5).map((x) => (
                  <li key={x.name} className="flex items-center gap-2.5 text-sm">
                    <CategoryIcon icon={x.icon} color={x.color} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">{x.name}</span>
                    <span className="font-bold text-muted tabular-nums">{Math.round((x.total / Math.max(1, totals.expense)) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">Belum ada pengeluaran bulan ini.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle action={<Link href="/transaksi" className="inline-flex items-center gap-1 text-sm font-bold text-mocha hover:underline">Semua <ArrowRight className="size-4" /></Link>}>Transaksi terakhir</CardTitle>
          {recent.rows.length ? (
            <TxList rows={recent.rows} wallets={w} categories={c} grouped={false} showAuthor={role === "partner" || book.ownerId !== user.id} />
          ) : (
            <EmptyState pose="coin" title="Belum ada transaksi" text="Tekan tombol Catat transaksi untuk mulai. Bisa ketik singkat seperti 25rb." />
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle action={<Link href="/anggaran" className="text-sm font-bold text-mocha hover:underline">Atur</Link>}>Anggaran bulan ini</CardTitle>
            {budgets.length ? (
              <ul className="space-y-4">
                {budgets.slice(0, 4).map((b) => {
                  const pct = (b.spent / b.amount) * 100;
                  return (
                    <li key={b.id}>
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-semibold text-ink">{b.name}</span>
                        <span className={`shrink-0 font-bold ${pct > 100 ? "text-expense" : "text-muted"}`}>{Math.round(pct)}%</span>
                      </div>
                      <Progress value={pct} tone={pct > 100 ? "expense" : pct >= 80 ? "caramel" : "income"} label={`Anggaran ${b.name}`} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">Belum ada anggaran. <Link href="/anggaran" className="font-bold text-mocha underline">Buat sekarang</Link></p>
            )}
          </Card>

          <Card>
            <CardTitle action={<Link href="/tabungan" className="text-sm font-bold text-mocha hover:underline">Lihat</Link>}>Target tabungan</CardTitle>
            {activeGoals.length ? (
              <ul className="space-y-4">
                {activeGoals.slice(0, 3).map((g) => (
                  <li key={g.id} className="flex items-center gap-3">
                    <CategoryIcon icon={g.icon} color={g.color} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex justify-between gap-2 text-sm">
                        <span className="truncate font-semibold text-ink">{g.name}</span>
                        <span className="shrink-0 font-bold text-muted">{Math.min(100, Math.round((g.saved / g.targetAmount) * 100))}%</span>
                      </div>
                      <Progress value={(g.saved / g.targetAmount) * 100} tone="caramel" label={`Progres ${g.name}`} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Mau menabung untuk apa? <Link href="/tabungan" className="font-bold text-mocha underline">Buat target</Link></p>
            )}
          </Card>

          {ent.features.bills && (
            <Card>
              <CardTitle action={<Link href="/tagihan" className="text-sm font-bold text-mocha hover:underline">Lihat</Link>}>Tagihan terdekat</CardTitle>
              {bills.length ? (
                <ul className="space-y-3">
                  {bills.slice(0, 3).map((b) => {
                    const d = daysBetween(today, b.nextDueOn);
                    return (
                      <li key={b.id} className="flex items-center gap-3 text-sm">
                        <span className={`grid size-10 place-items-center rounded-xl ${d < 0 ? "bg-expense-soft text-expense" : d <= 3 ? "bg-caramel-soft text-[#9a5f22]" : "bg-sky-soft text-[#3d6e98]"}`}>
                          <CalendarClock className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-ink">{b.name}</span>
                          <span className={`text-xs font-semibold ${d < 0 ? "text-expense" : "text-muted"}`}>{d < 0 ? `Telat ${-d} hari` : relativeDayLabel(b.nextDueOn)}</span>
                        </span>
                        <span className="font-bold text-ink tabular-nums">{formatRupiahShort(b.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">Tidak ada tagihan aktif.</p>
              )}
            </Card>
          )}

          <Card>
            <CardTitle action={<Link href="/dompet" className="text-sm font-bold text-mocha hover:underline">Kelola</Link>}>Dompet</CardTitle>
            <ul className="space-y-2.5">
              {wallets.map((x) => (
                <li key={x.id} className="flex items-center gap-3 text-sm">
                  <CategoryIcon icon="wallet" color={x.color} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{x.name}</span>
                  <span className={`font-bold tabular-nums ${x.balance < 0 ? "text-expense" : "text-ink"}`}>{formatRupiah(x.balance)}</span>
                </li>
              ))}
            </ul>
            {wallets.length === 0 && <Wallet className="size-5" />}
          </Card>
        </div>
      </div>
    </div>
  );
}
