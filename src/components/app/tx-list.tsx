"use client";

import { useCallback, useState } from "react";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { Dialog } from "@/components/ui/dialog";
import { deleteTransaction } from "@/lib/actions/finance";
import { relativeDayLabel } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ActionButton } from "./confirm-form";
import { TransactionForm, type CatOpt, type WalletOpt } from "./transaction-form";

export type TxItem = {
  id: string;
  kind: "income" | "expense" | "transfer";
  amount: number;
  note: string | null;
  occurredOn: string;
  walletId: string;
  walletName: string;
  toWalletId: string | null;
  toWalletName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  createdByName: string | null;
};

export function TxList({ rows, wallets, categories, grouped = true, showAuthor = false }: { rows: TxItem[]; wallets: WalletOpt[]; categories: CatOpt[]; grouped?: boolean; showAuthor?: boolean }) {
  const [edit, setEdit] = useState<TxItem | null>(null);
  const close = useCallback(() => setEdit(null), []);
  const groups: { day: string; items: TxItem[] }[] = [];
  for (const r of rows) {
    const g = groups.at(-1);
    if (grouped && g?.day === r.occurredOn) g.items.push(r);
    else groups.push({ day: r.occurredOn, items: [r] });
  }
  const merged = grouped ? groups : [{ day: "", items: rows }];

  return (
    <>
      <div className="space-y-4">
        {merged.map((g, gi) => (
          <section key={g.day + gi}>
            {grouped && (
              <h3 className="mb-1 flex items-center justify-between px-1 text-xs font-bold tracking-wide text-muted uppercase">
                {relativeDayLabel(g.day)}
                <span className="normal-case tracking-normal">
                  {(() => {
                    const net = g.items.reduce((s, i) => s + (i.kind === "income" ? i.amount : i.kind === "expense" ? -i.amount : 0), 0);
                    return net ? formatRupiah(net, { sign: true }) : "";
                  })()}
                </span>
              </h3>
            )}
            <ul className="divide-y divide-line">
              {g.items.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setEdit(t)} className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left hover:bg-cream-2">
                    {t.kind === "transfer" ? (
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-soft text-[#3d6e98]">
                        <ArrowLeftRight className="size-5" />
                      </span>
                    ) : (
                      <CategoryIcon icon={t.categoryIcon ?? "circle"} color={t.categoryColor ?? "latte"} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">
                        {t.kind === "transfer" ? `${t.walletName} → ${t.toWalletName}` : t.note || t.categoryName || "Tanpa kategori"}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {t.kind === "transfer" ? t.note || "Transfer antar dompet" : `${t.note ? (t.categoryName ?? "Tanpa kategori") + " · " : ""}${t.walletName}`}
                        {showAuthor && t.createdByName ? ` · oleh ${t.createdByName.split(" ")[0]}` : ""}
                        {!grouped ? ` · ${relativeDayLabel(t.occurredOn)}` : ""}
                      </span>
                    </span>
                    <span className={cn("shrink-0 font-bold tabular-nums", t.kind === "income" ? "text-income" : t.kind === "expense" ? "text-expense" : "text-ink")}>
                      {t.kind === "income" ? "+" : t.kind === "expense" ? "-" : ""}
                      {formatRupiah(t.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Dialog open={!!edit} onClose={close} title="Ubah transaksi">
        {edit && (
          <>
            <TransactionForm key={edit.id} wallets={wallets} categories={categories} defaults={edit} onDone={close} />
            <div className="mt-3 border-t border-line pt-3">
              <ActionButton action={deleteTransaction} fields={{ id: edit.id }} variant="danger-soft" className="w-full" confirm="Hapus transaksi ini? Tindakan ini tidak bisa dibatalkan." pendingText="Menghapus…" onDone={close}>
                <Trash2 className="size-4" /> Hapus transaksi
              </ActionButton>
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
