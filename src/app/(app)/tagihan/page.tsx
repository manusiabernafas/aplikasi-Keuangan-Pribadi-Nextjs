import type { Metadata } from "next";
import { Check, CheckCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { PremiumGate } from "@/components/app/premium-gate";
import { FormDialog } from "@/components/app/form-dialog";
import { ActionButton } from "@/components/app/confirm-form";
import { CategoryIcon } from "@/components/category-icon";
import { CalendarArt } from "@/components/illustrations/scenes";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteBill, payBill } from "@/lib/actions/finance";
import { requireBook } from "@/lib/auth/session";
import { addDaysISO, daysBetween, relativeDayLabel, todayISO } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { getBookEntitlement } from "@/lib/server/plans";
import { getBills, getCategories, getWallets } from "@/lib/server/queries";
import { BillForm } from "./bill-form";

export const metadata: Metadata = { title: "Tagihan" };
const FREQ = { weekly: "tiap minggu", monthly: "tiap bulan", yearly: "tiap tahun" } as const;

export default async function TagihanPage() {
  const { book, role } = await requireBook();
  const ent = await getBookEntitlement(book.ownerId);
  if (!ent.features.bills)
    return (
      <div>
        <PageHeader title="Tagihan rutin" text="Listrik, internet, cicilan, langganan. Jangan sampai telat bayar." />
        <PremiumGate
          isOwner={role === "owner"}
          title="Tidak ada lagi tagihan yang terlupa"
          text="Catat tagihan rutinmu sekali, Boma yang mengingatkan dan mencatat pembayarannya."
          art={<CalendarArt className="w-56" />}
          points={["Daftar tagihan dengan jatuh tempo", "Tanda telat & segera jatuh tempo", "Bayar sekali klik, otomatis tercatat"]}
        />
      </div>
    );

  const [bills, categories, wallets] = await Promise.all([getBills(book.id), getCategories(book.id), getWallets(book.id)]);
  const cats = categories.filter((c) => c.kind === "expense").map((c) => ({ id: c.id, name: c.name }));
  const ws = wallets.map((w) => ({ id: w.id, name: w.name }));
  const today = todayISO();
  const monthTotal = bills.filter((b) => b.nextDueOn <= addDaysISO(today, 30)).reduce((s, b) => s + b.amount, 0);
  const late = bills.filter((b) => b.nextDueOn < today);

  const addBtn = (
    <FormDialog title="Tagihan baru" trigger={<><Plus className="size-4" /> Tambah tagihan</>}>
      <BillForm categories={cats} wallets={ws} />
    </FormDialog>
  );

  return (
    <div>
      <PageHeader title="Tagihan rutin" text="Tandai lunas, Boma catat pengeluarannya dan majukan jatuh temponya." pose="think" action={addBtn} />
      {bills.length > 0 && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <Card className="flex items-center gap-4">
            <CalendarArt className="w-16 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-muted">Perlu dibayar 30 hari ke depan</p>
              <p className="font-display text-2xl font-extrabold text-ink tabular-nums">{formatRupiah(monthTotal)}</p>
            </div>
          </Card>
          <Card className={late.length ? "border-expense/40 bg-expense-soft" : ""}>
            <p className="text-sm font-semibold text-muted">Status</p>
            <p className={`font-display text-xl font-extrabold ${late.length ? "text-expense" : "text-income"}`}>{late.length ? `${late.length} tagihan telat` : "Semua aman, tidak ada yang telat"}</p>
          </Card>
        </div>
      )}
      {bills.length ? (
        <ul className="space-y-3">
          {bills.map((b) => {
            const d = daysBetween(today, b.nextDueOn);
            const status = d < 0 ? { t: `Telat ${-d} hari`, c: "bg-expense-soft text-expense" } : d <= 3 ? { t: relativeDayLabel(b.nextDueOn), c: "bg-caramel-soft text-[#9a5f22]" } : { t: relativeDayLabel(b.nextDueOn), c: "bg-sky-soft text-[#3d6e98]" };
            return (
              <li key={b.id}>
                <Card className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                  <CategoryIcon icon={b.icon ?? "receipt"} color={b.color ?? "mocha"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">{b.name}</p>
                    <p className="text-sm text-muted">{formatRupiah(b.amount)} · {FREQ[b.frequency]}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.c}`}>{status.t}</span>
                  <div className="flex w-full items-center gap-1 sm:w-auto">
                    <ActionButton action={payBill} fields={{ id: b.id, record: b.walletId ? "1" : "0" }} variant="primary" pendingText="Mencatat…" className="flex-1 sm:flex-none">
                      <Check className="size-4" /> {b.walletId ? "Bayar" : "Tandai lunas"}
                    </ActionButton>
                    {b.walletId && (
                      <ActionButton action={payBill} fields={{ id: b.id, record: "0" }} pendingText="" className="size-11 px-0">
                        <CheckCheck className="size-4" aria-label="Tandai lunas tanpa mencatat pengeluaran" />
                      </ActionButton>
                    )}
                    <FormDialog title="Ubah tagihan" className="grid size-11 place-items-center rounded-2xl text-muted hover:bg-latte-2" triggerLabel={`Ubah ${b.name}`} trigger={<Pencil className="size-4" />}>
                      <BillForm categories={cats} wallets={ws} defaults={b} />
                    </FormDialog>
                    <ActionButton action={deleteBill} fields={{ id: b.id }} confirm={`Hapus tagihan ${b.name}?`} pendingText="" className="size-11 px-0">
                      <Trash2 className="size-4" aria-label="Hapus" />
                    </ActionButton>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState pose="think" title="Belum ada tagihan" text="Tambahkan tagihan rutin seperti listrik, internet, atau cicilan." action={addBtn} />
      )}
    </div>
  );
}
