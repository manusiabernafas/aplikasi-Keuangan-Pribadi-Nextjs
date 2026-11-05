"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { saveTransaction } from "@/lib/actions/finance";
import { CategoryIcon } from "@/components/category-icon";
import { Field, Input, Select, errProps } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { addDaysISO, todayISO } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { cn } from "@/lib/utils";

export type Opt = { id: string; name: string };
export type CatOpt = { id: string; name: string; kind: "income" | "expense"; icon: string; color: string };
export type WalletOpt = { id: string; name: string; balance: number };
export type TxDefaults = { id?: string; kind?: "income" | "expense" | "transfer"; amount?: number; walletId?: string; toWalletId?: string | null; categoryId?: string | null; occurredOn?: string; note?: string | null };

const KINDS = [
  { v: "expense", label: "Pengeluaran", icon: ArrowUpRight, on: "bg-expense text-white" },
  { v: "income", label: "Pemasukan", icon: ArrowDownLeft, on: "bg-income text-white" },
  { v: "transfer", label: "Transfer", icon: ArrowLeftRight, on: "bg-sky text-white" },
] as const;

export function TransactionForm({ wallets, categories, defaults, onDone }: { wallets: WalletOpt[]; categories: CatOpt[]; defaults?: TxDefaults; onDone?: () => void }) {
  const [state, action] = useActionState(saveTransaction, null);
  const [kind, setKind] = useState<"income" | "expense" | "transfer">(defaults?.kind ?? "expense");
  const [date, setDate] = useState(defaults?.occurredOn ?? todayISO());
  const [cat, setCat] = useState<string | null>(defaults?.categoryId ?? null);
  const err = state?.errors ?? {};
  const today = todayISO();
  const cats = categories.filter((c) => c.kind === kind);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onDone?.();
    } else if (state?.message) toast.error(state.message);
  }, [state, onDone]);

  if (!wallets.length) return <p className="text-muted">Buat dompet dulu di menu Dompet.</p>;

  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="kind" value={kind} />
      <div role="radiogroup" aria-label="Jenis transaksi" className="grid grid-cols-3 gap-1 rounded-2xl bg-cream-2 p-1">
        {KINDS.map((k) => (
          <button
            key={k.v}
            type="button"
            role="radio"
            aria-checked={kind === k.v}
            onClick={() => {
              setKind(k.v);
              setCat(null);
            }}
            className={cn("flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-bold transition-colors", kind === k.v ? k.on : "text-muted hover:text-ink")}
          >
            <k.icon className="size-4" /> {k.label}
          </button>
        ))}
      </div>

      <Field label="Nominal" htmlFor="tx-amount" error={err.amount}>
        <MoneyInput id="tx-amount" name="amount" defaultValue={defaults?.amount} error={err.amount} autoFocus={!defaults?.id} />
      </Field>

      {kind !== "transfer" ? (
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink">Kategori</legend>
          <input type="hidden" name="categoryId" value={cat ?? ""} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={cat === c.id}
                onClick={() => setCat(c.id)}
                className={cn("flex flex-col items-center gap-1.5 rounded-2xl border-2 px-1 py-2.5 text-center text-xs font-semibold transition-colors", cat === c.id ? "border-mocha bg-mocha-soft text-ink" : "border-line text-muted hover:border-latte")}
              >
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="line-clamp-2 leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
          {err.categoryId && <p role="alert" className="mt-1.5 text-sm font-semibold text-expense">{err.categoryId}</p>}
        </fieldset>
      ) : null}

      <div className={cn("grid gap-4", kind === "transfer" && "sm:grid-cols-2")}>
        <Field label={kind === "transfer" ? "Dari dompet" : kind === "income" ? "Masuk ke dompet" : "Bayar dari dompet"} htmlFor="tx-wallet" error={err.walletId}>
          <Select id="tx-wallet" name="walletId" defaultValue={defaults?.walletId ?? wallets[0].id} {...errProps("tx-wallet", err.walletId)}>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} · {formatRupiah(w.balance)}
              </option>
            ))}
          </Select>
        </Field>
        {kind === "transfer" && (
          <Field label="Ke dompet" htmlFor="tx-to" error={err.toWalletId}>
            <Select id="tx-to" name="toWalletId" defaultValue={defaults?.toWalletId ?? wallets[1]?.id ?? ""} {...errProps("tx-to", err.toWalletId)}>
              <option value="">Pilih dompet tujuan</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <Field label="Tanggal" htmlFor="tx-date" error={err.occurredOn}>
        <div className="flex flex-wrap gap-2">
          {[
            { l: "Hari ini", v: today },
            { l: "Kemarin", v: addDaysISO(today, -1) },
          ].map((d) => (
            <button key={d.l} type="button" onClick={() => setDate(d.v)} className={cn("rounded-xl border-2 px-3 py-2 text-sm font-bold", date === d.v ? "border-mocha bg-mocha-soft text-mocha" : "border-line text-muted hover:border-latte")}>
              {d.l}
            </button>
          ))}
          <Input id="tx-date" type="date" name="occurredOn" value={date} max="2100-12-31" onChange={(e) => setDate(e.target.value)} className="w-auto flex-1 py-2" {...errProps("tx-date", err.occurredOn)} />
        </div>
      </Field>

      <Field label="Catatan" htmlFor="tx-note" optional error={err.note}>
        <Input id="tx-note" name="note" maxLength={200} defaultValue={defaults?.note ?? ""} placeholder={kind === "expense" ? "Contoh: makan siang bareng tim" : kind === "income" ? "Contoh: gaji bulan ini" : "Contoh: isi saldo e-wallet"} />
      </Field>

      <SubmitButton className="w-full" pendingText="Menyimpan…">
        {defaults?.id ? "Simpan perubahan" : "Simpan"}
      </SubmitButton>
    </form>
  );
}
