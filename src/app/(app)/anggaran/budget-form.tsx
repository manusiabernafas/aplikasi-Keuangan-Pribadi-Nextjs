"use client";

import { saveBudget } from "@/lib/actions/finance";
import { useActionForm } from "@/components/app/form-dialog";
import { Field, Select, errProps } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";

export function BudgetForm({ month, categories, defaults, avg }: { month: string; categories: { id: string; name: string }[]; defaults?: { categoryId: string; amount: number }; avg?: Record<string, number> }) {
  const [, action, err] = useActionForm(saveBudget);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="month" value={month.slice(0, 7)} />
      {defaults ? (
        <input type="hidden" name="categoryId" value={defaults.categoryId} />
      ) : (
        <Field label="Kategori pengeluaran" htmlFor="b-cat" error={err.categoryId}>
          <Select id="b-cat" name="categoryId" defaultValue="" {...errProps("b-cat", err.categoryId)}>
            <option value="" disabled>Pilih kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Batas per bulan" htmlFor="b-amount" error={err.amount} hint={avg && Object.keys(avg).length ? "Tips: lihat rata-rata pengeluaranmu 3 bulan terakhir di halaman Laporan." : undefined}>
        <MoneyInput id="b-amount" name="amount" defaultValue={defaults?.amount} error={err.amount} autoFocus quick={[500000, 1000000, 2000000]} />
      </Field>
      <SubmitButton className="w-full">Simpan anggaran</SubmitButton>
    </form>
  );
}
