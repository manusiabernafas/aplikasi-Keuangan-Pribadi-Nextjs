"use client";

import { saveBill } from "@/lib/actions/finance";
import { useActionForm } from "@/components/app/form-dialog";
import { Field, Input, Select, errProps } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { todayISO } from "@/lib/dates";

type Opt = { id: string; name: string };
export type BillDefaults = { id: string; name: string; amount: number; categoryId: string | null; walletId: string | null; frequency: "weekly" | "monthly" | "yearly"; nextDueOn: string };

export function BillForm({ categories, wallets, defaults }: { categories: Opt[]; wallets: Opt[]; defaults?: BillDefaults }) {
  const [, action, err] = useActionForm(saveBill);
  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <Field label="Nama tagihan" htmlFor="bl-name" error={err.name}>
        <Input id="bl-name" name="name" defaultValue={defaults?.name} maxLength={60} placeholder="Contoh: Listrik PLN, Internet, Cicilan motor" autoFocus {...errProps("bl-name", err.name)} />
      </Field>
      <Field label="Nominal" htmlFor="bl-amount" error={err.amount} hint="Untuk tagihan yang berubah-ubah, isi perkiraan rata-ratanya.">
        <MoneyInput id="bl-amount" name="amount" defaultValue={defaults?.amount} error={err.amount} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Berulang setiap" htmlFor="bl-freq" error={err.frequency}>
          <Select id="bl-freq" name="frequency" defaultValue={defaults?.frequency ?? "monthly"}>
            <option value="weekly">Minggu</option>
            <option value="monthly">Bulan</option>
            <option value="yearly">Tahun</option>
          </Select>
        </Field>
        <Field label="Jatuh tempo berikutnya" htmlFor="bl-due" error={err.nextDueOn}>
          <Input id="bl-due" name="nextDueOn" type="date" max="2100-12-31" defaultValue={defaults?.nextDueOn ?? todayISO()} {...errProps("bl-due", err.nextDueOn)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" htmlFor="bl-cat" optional error={err.categoryId}>
          <Select id="bl-cat" name="categoryId" defaultValue={defaults?.categoryId ?? categories.find((c) => c.name.startsWith("Tagihan"))?.id ?? ""}>
            <option value="">Tanpa kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Dibayar dari" htmlFor="bl-wallet" optional error={err.walletId}>
          <Select id="bl-wallet" name="walletId" defaultValue={defaults?.walletId ?? wallets[0]?.id ?? ""}>
            <option value="">Belum ditentukan</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </Field>
      </div>
      <SubmitButton className="w-full">{defaults ? "Simpan perubahan" : "Tambah tagihan"}</SubmitButton>
    </form>
  );
}
