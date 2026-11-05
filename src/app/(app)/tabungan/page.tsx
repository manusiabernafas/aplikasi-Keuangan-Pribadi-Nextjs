import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArchiveRestore, Crown, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FormDialog } from "@/components/app/form-dialog";
import { ActionButton } from "@/components/app/confirm-form";
import { CategoryIcon } from "@/components/category-icon";
import { GoalArt } from "@/components/illustrations/scenes";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { buttonClass } from "@/components/ui/button";
import { deleteGoal, setGoalArchived } from "@/lib/actions/finance";
import { requireBook } from "@/lib/auth/session";
import { dateLabel, daysBetween, relativeDayLabel, todayISO } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { getBookEntitlement } from "@/lib/server/plans";
import { getGoalEntries, getGoals } from "@/lib/server/queries";
import { GoalEntryForm, GoalForm } from "./goal-forms";

export const metadata: Metadata = { title: "Target tabungan" };

export default async function TabunganPage() {
  const { book } = await requireBook();
  const [goals, ent] = await Promise.all([getGoals(book.id), getBookEntitlement(book.ownerId)]);
  const active = goals.filter((g) => !g.archived);
  const archived = goals.filter((g) => g.archived);
  const entries = await Promise.all(active.map((g) => getGoalEntries(book.id, g.id)));
  const today = todayISO();
  const max = ent.features.maxGoals;
  const canAdd = max === null || active.length < max;
  const totalSaved = active.reduce((s, g) => s + g.saved, 0);

  const addBtn = canAdd ? (
    <FormDialog title="Target tabungan baru" trigger={<><Plus className="size-4" /> Target baru</>}>
      <GoalForm />
    </FormDialog>
  ) : (
    <Link href="/langganan" className={buttonClass({ variant: "secondary" })}>
      <Crown className="size-4 text-caramel" /> Tambah target (Premium)
    </Link>
  );

  return (
    <div>
      <PageHeader title="Target tabungan" text="Sisihkan sedikit demi sedikit untuk hal yang kamu impikan." pose="happy" action={addBtn} />

      {active.length > 0 && (
        <Card className="mb-5 flex items-center gap-5 bg-caramel-soft">
          <GoalArt className="w-24 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-muted">Total sudah terkumpul</p>
            <p className="font-display text-3xl font-extrabold text-mocha tabular-nums">{formatRupiah(totalSaved)}</p>
            <p className="text-sm text-muted">di {active.length} target aktif</p>
          </div>
        </Card>
      )}

      {active.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((g, i) => {
            const pct = (g.saved / g.targetAmount) * 100;
            const left = Math.max(0, g.targetAmount - g.saved);
            const days = g.deadline ? daysBetween(today, g.deadline) : null;
            const months = days !== null ? Math.max(1, Math.ceil(days / 30)) : null;
            return (
              <Card key={g.id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <CategoryIcon icon={g.icon} color={g.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-ink">{g.name}</p>
                    <p className="text-sm text-muted">{g.deadline ? `Tenggat ${dateLabel(g.deadline)}` : "Tanpa tenggat"}</p>
                  </div>
                  <FormDialog title="Ubah target" className="grid size-9 place-items-center rounded-xl text-muted hover:bg-latte-2" triggerLabel={`Ubah ${g.name}`} trigger={<Pencil className="size-4" />}>
                    <GoalForm defaults={g} />
                  </FormDialog>
                </div>
                <p className="mt-4 font-display text-2xl font-extrabold text-ink tabular-nums">
                  {formatRupiah(g.saved)} <span className="text-sm font-bold text-muted">/ {formatRupiah(g.targetAmount)}</span>
                </p>
                <Progress value={pct} tone={pct >= 100 ? "income" : "caramel"} className="mt-2 h-3" label={`Progres ${g.name}`} />
                <p className="mt-2 text-sm font-semibold text-muted">
                  {pct >= 100
                    ? "Target tercapai! Selamat, kerja bagus."
                    : days !== null && days < 0
                      ? <span className="text-expense">Tenggat sudah lewat, kurang {formatRupiah(left)}</span>
                      : months
                        ? <>Kurang {formatRupiah(left)} · sisihkan sekitar <b className="text-ink">{formatRupiah(Math.ceil(left / months))}</b>/bulan</>
                        : `Kurang ${formatRupiah(left)} lagi`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <FormDialog title={`Setor ke ${g.name}`} trigger={<><Plus className="size-4" /> Setor</>}>
                    <GoalEntryForm goalId={g.id} direction="in" />
                  </FormDialog>
                  {g.saved > 0 && (
                    <FormDialog title={`Tarik dari ${g.name}`} variant="secondary" trigger={<><Minus className="size-4" /> Tarik</>}>
                      <GoalEntryForm goalId={g.id} direction="out" max={g.saved} />
                    </FormDialog>
                  )}
                  <div className="flex-1" />
                  <ActionButton action={setGoalArchived} fields={{ id: g.id, archived: "1" }} pendingText="">
                    <Archive className="size-4" /> Arsip
                  </ActionButton>
                </div>
                {entries[i].length > 0 && (
                  <details className="mt-4 border-t border-line pt-3">
                    <summary className="cursor-pointer text-sm font-bold text-mocha">Riwayat ({entries[i].length})</summary>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {entries[i].map((e) => (
                        <li key={e.id} className="flex justify-between gap-3">
                          <span className="min-w-0 truncate text-muted">{relativeDayLabel(e.occurredOn)}{e.note ? ` · ${e.note}` : ""}{e.by ? ` · ${e.by.split(" ")[0]}` : ""}</span>
                          <span className={`shrink-0 font-bold tabular-nums ${e.amount > 0 ? "text-income" : "text-expense"}`}>{formatRupiah(e.amount, { sign: true })}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState pose="happy" title="Belum ada target tabungan" text="Liburan, dana darurat, gadget baru, atau DP rumah. Tulis impianmu dan mulai menabung." action={addBtn} />
      )}

      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold text-ink">Arsip</h2>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-card px-5">
            {archived.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 py-3">
                <CategoryIcon icon={g.icon} color={g.color} size="sm" />
                <span className="min-w-0 flex-1 truncate font-semibold text-ink">{g.name}</span>
                <span className="text-sm text-muted tabular-nums">{formatRupiah(g.saved)}</span>
                <ActionButton action={setGoalArchived} fields={{ id: g.id, archived: "0" }} pendingText="">
                  <ArchiveRestore className="size-4" /> Aktifkan
                </ActionButton>
                <ActionButton action={deleteGoal} fields={{ id: g.id }} confirm={`Hapus target "${g.name}" beserta riwayat setorannya? Tidak bisa dibatalkan.`} variant="danger-soft" pendingText="">
                  <Trash2 className="size-4" /> Hapus
                </ActionButton>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
