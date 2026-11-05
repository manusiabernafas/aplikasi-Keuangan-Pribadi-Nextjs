import type { Metadata } from "next";
import { CopyPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { MonthNav, monthFromParam } from "@/components/app/month-nav";
import { PageHeader } from "@/components/app/page-header";
import { FormDialog } from "@/components/app/form-dialog";
import { ActionButton } from "@/components/app/confirm-form";
import { CategoryIcon } from "@/components/category-icon";
import { BudgetPieArt } from "@/components/illustrations/scenes";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { copyBudgets, deleteBudget } from "@/lib/actions/finance";
import { requireBook } from "@/lib/auth/session";
import { daysBetween, monthEnd, todayISO } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { getBudgets, getCategories } from "@/lib/server/queries";
import { BudgetForm } from "./budget-form";

export const metadata: Metadata = { title: "Anggaran" };

export default async function AnggaranPage({ searchParams }: PageProps<"/anggaran">) {
  const { book } = await requireBook();
  const month = monthFromParam((await searchParams).bulan);
  const [budgets, categories] = await Promise.all([getBudgets(book.id, month), getCategories(book.id)]);
  const used = new Set(budgets.map((b) => b.categoryId));
  const free = categories.filter((c) => c.kind === "expense" && !used.has(c.id));
  const total = budgets.reduce((s, b) => s + b.amount, 0);
  const spent = budgets.reduce((s, b) => s + b.spent, 0);
  const today = todayISO();
  const isCurrent = month.slice(0, 7) === today.slice(0, 7);
  const daysLeft = isCurrent ? daysBetween(today, monthEnd(month)) + 1 : 0;
  const remaining = total - spent;

  const addBtn = free.length > 0 && (
    <FormDialog title="Buat anggaran" trigger={<><Plus className="size-4" /> Tambah anggaran</>}>
      <BudgetForm month={month} categories={free.map((c) => ({ id: c.id, name: c.name }))} />
    </FormDialog>
  );

  return (
    <div>
      <PageHeader title="Anggaran" text="Batas belanja per kategori supaya tidak kebablasan." pose="chart" action={<div className="flex flex-wrap gap-2"><MonthNav month={month} path="/anggaran" />{addBtn}</div>} />

      {budgets.length > 0 && (
        <Card className="mb-5 flex flex-col gap-5 bg-mocha-soft sm:flex-row sm:items-center">
          <BudgetPieArt className="w-28 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted">Total terpakai</p>
            <p className="font-display text-2xl font-extrabold text-ink tabular-nums">
              {formatRupiah(spent)} <span className="text-base font-bold text-muted">dari {formatRupiah(total)}</span>
            </p>
            <Progress value={(spent / Math.max(1, total)) * 100} tone={spent > total ? "expense" : "mocha"} className="mt-3 h-3 bg-card" label="Total anggaran terpakai" />
            <p className="mt-2 text-sm font-semibold text-muted">
              {remaining >= 0 ? (
                <>Sisa {formatRupiah(remaining)}{isCurrent && daysLeft > 0 ? <> · aman dipakai sekitar <b className="text-ink">{formatRupiah(Math.floor(remaining / daysLeft))}</b> per hari sampai akhir bulan</> : null}</>
              ) : (
                <span className="text-expense">Lewat {formatRupiah(-remaining)} dari total anggaran</span>
              )}
            </p>
          </div>
        </Card>
      )}

      {budgets.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((b) => {
            const pct = (b.spent / b.amount) * 100;
            const tone = pct > 100 ? "expense" : pct >= 80 ? "caramel" : "income";
            return (
              <Card key={b.id}>
                <div className="flex items-center gap-3">
                  <CategoryIcon icon={b.icon} color={b.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{b.name}</p>
                    <p className="text-sm text-muted tabular-nums">{formatRupiah(b.spent)} / {formatRupiah(b.amount)}</p>
                  </div>
                  <FormDialog title={`Ubah anggaran ${b.name}`} variant="ghost" className="grid size-9 place-items-center rounded-xl text-muted hover:bg-latte-2" triggerLabel={`Ubah anggaran ${b.name}`} trigger={<Pencil className="size-4" />}>
                    <BudgetForm month={month} categories={[]} defaults={{ categoryId: b.categoryId, amount: b.amount }} />
                  </FormDialog>
                  <ActionButton action={deleteBudget} fields={{ id: b.id }} confirm={`Hapus anggaran ${b.name}?`} className="size-9 px-0" pendingText="">
                    <Trash2 className="size-4" aria-label="Hapus" />
                  </ActionButton>
                </div>
                <Progress value={pct} tone={tone} className="mt-4" label={`Anggaran ${b.name}`} />
                <p className={`mt-2 text-sm font-semibold ${pct > 100 ? "text-expense" : "text-muted"}`}>
                  {pct > 100 ? `Lewat ${formatRupiah(b.spent - b.amount)}` : `Sisa ${formatRupiah(b.amount - b.spent)} (${Math.round(100 - pct)}%)`}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          pose="chart"
          title="Belum ada anggaran bulan ini"
          text="Mulai dari kategori yang paling sering bikin boncos, misalnya Makan & minum."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {addBtn}
              <ActionButton action={copyBudgets} fields={{ month: month.slice(0, 7) }} variant="secondary" pendingText="Menyalin…">
                <CopyPlus className="size-4" /> Salin dari bulan lalu
              </ActionButton>
            </div>
          }
        />
      )}
    </div>
  );
}
