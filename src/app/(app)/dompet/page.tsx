import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArchiveRestore, Banknote, Crown, Landmark, Pencil, Plus, Smartphone, Wallet } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FormDialog } from "@/components/app/form-dialog";
import { ActionButton } from "@/components/app/confirm-form";
import { COLORS, type ColorName } from "@/components/category-icon";
import { WalletArt } from "@/components/illustrations/scenes";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { setWalletArchived } from "@/lib/actions/finance";
import { requireBook } from "@/lib/auth/session";
import { formatRupiah } from "@/lib/money";
import { getBookEntitlement } from "@/lib/server/plans";
import { getWallets } from "@/lib/server/queries";
import { WalletForm } from "./wallet-form";

export const metadata: Metadata = { title: "Dompet" };
const TYPE = { cash: { l: "Tunai", i: Banknote }, bank: { l: "Rekening bank", i: Landmark }, ewallet: { l: "E-wallet", i: Smartphone }, other: { l: "Lainnya", i: Wallet } } as const;

export default async function DompetPage() {
  const { book } = await requireBook();
  const [wallets, ent] = await Promise.all([getWallets(book.id, true), getBookEntitlement(book.ownerId)]);
  const active = wallets.filter((w) => !w.archived);
  const archived = wallets.filter((w) => w.archived);
  const total = active.reduce((s, w) => s + w.balance, 0);
  const max = ent.features.maxWallets;
  const canAdd = max === null || active.length < max;

  return (
    <div>
      <PageHeader
        title="Dompet"
        text="Tempat uangmu disimpan: tunai, rekening, e-wallet."
        action={
          canAdd ? (
            <FormDialog title="Dompet baru" trigger={<><Plus className="size-4" /> Tambah dompet</>}>
              <WalletForm />
            </FormDialog>
          ) : (
            <Link href="/langganan" className={buttonClass({ variant: "secondary" })}>
              <Crown className="size-4 text-caramel" /> Batas {max} dompet · Upgrade
            </Link>
          )
        }
      />
      <Card className="mb-5 flex items-center gap-5 bg-mocha-soft">
        <WalletArt className="w-24 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-muted">Total di semua dompet</p>
          <p className="font-display text-3xl font-extrabold text-mocha tabular-nums">{formatRupiah(total)}</p>
          <p className="text-sm text-muted">{active.length} dompet aktif{max !== null ? ` dari maksimal ${max}` : ""}</p>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((w) => {
          const T = TYPE[w.type];
          return (
            <Card key={w.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className={`grid size-12 place-items-center rounded-2xl ${COLORS[w.color as ColorName] ?? COLORS.latte}`}>
                  <T.i className="size-6" />
                </span>
                <FormDialog title="Ubah dompet" className="grid size-9 place-items-center rounded-xl text-muted hover:bg-latte-2" triggerLabel={`Ubah ${w.name}`} trigger={<Pencil className="size-4" />}>
                  <WalletForm defaults={w} />
                </FormDialog>
              </div>
              <p className="mt-4 truncate font-bold text-ink">{w.name}</p>
              <p className="text-xs font-semibold text-muted">{T.l}</p>
              <p className={`mt-2 font-display text-2xl font-extrabold tabular-nums ${w.balance < 0 ? "text-expense" : "text-ink"}`}>{formatRupiah(w.balance)}</p>
              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <Link href={`/transaksi?dompet=${w.id}`} className="flex-1 rounded-xl px-3 py-2 text-center text-sm font-bold text-mocha hover:bg-latte-2">Riwayat</Link>
                {active.length > 1 && (
                  <ActionButton action={setWalletArchived} fields={{ id: w.id, archived: "1" }} confirm={`Arsipkan ${w.name}? Riwayat transaksinya tetap tersimpan.`} pendingText="" className="h-9">
                    <Archive className="size-4" /> Arsip
                  </ActionButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">Diarsipkan</h2>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-card px-5">
            {archived.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{w.name}</span>
                <span className="text-sm text-muted tabular-nums">{formatRupiah(w.balance)}</span>
                <ActionButton action={setWalletArchived} fields={{ id: w.id, archived: "0" }} pendingText="">
                  <ArchiveRestore className="size-4" /> Aktifkan
                </ActionButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
