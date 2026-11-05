"use client";

import { savePlan } from "@/lib/actions/admin";
import { useActionForm } from "@/components/app/form-dialog";
import { Field, Input, Textarea, errProps } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PlanFeatures } from "@/lib/db/schema";

type Plan = { id: string; code: string; name: string; description: string | null; price: number; periodDays: number; active: boolean; features: PlanFeatures };

export function PlanForm({ plan }: { plan: Plan }) {
  const [, action, err] = useActionForm(savePlan, { keepOpen: true });
  const isFree = plan.code === "free";
  const f = plan.features;
  const p = plan.id.slice(0, 6);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={plan.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama paket" htmlFor={`${p}-name`} error={err.name}>
          <Input id={`${p}-name`} name="name" defaultValue={plan.name} maxLength={40} {...errProps(`${p}-name`, err.name)} />
        </Field>
        {!isFree && (
          <Field label="Durasi (hari)" htmlFor={`${p}-period`} error={err.periodDays}>
            <Input id={`${p}-period`} name="periodDays" type="number" min={1} max={366} defaultValue={plan.periodDays} {...errProps(`${p}-period`, err.periodDays)} />
          </Field>
        )}
      </div>
      {!isFree ? (
        <Field label="Harga" htmlFor={`${p}-price`} error={err.price} hint="Berlaku untuk pembayaran baru. Langganan yang sudah dibayar tidak berubah.">
          <MoneyInput id={`${p}-price`} name="price" defaultValue={plan.price} error={err.price} />
        </Field>
      ) : (
        <input type="hidden" name="price" value="0" />
      )}
      {isFree && <input type="hidden" name="periodDays" value="0" />}
      <Field label="Deskripsi singkat" htmlFor={`${p}-desc`} optional error={err.description}>
        <Textarea id={`${p}-desc`} name="description" defaultValue={plan.description ?? ""} maxLength={200} rows={2} />
      </Field>
      <fieldset className="rounded-2xl border border-line p-4">
        <legend className="px-1 text-sm font-bold text-ink">Batas (kosongkan = tanpa batas)</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {([["maxWallets", "Dompet"], ["maxGoals", "Target"], ["maxCategories", "Kategori"]] as const).map(([k, l]) => (
            <Field key={k} label={l} htmlFor={`${p}-${k}`} error={err[k]}>
              <Input id={`${p}-${k}`} name={k} type="number" min={0} max={10000} defaultValue={f[k] ?? ""} placeholder="Tanpa batas" />
            </Field>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2 rounded-2xl border border-line p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-bold text-ink">Fitur</legend>
        {([["partner", "Ajak pasangan"], ["bills", "Pengingat tagihan"], ["fullReports", "Laporan lengkap & tren"], ["export", "Unduh CSV"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center gap-2.5 font-semibold text-ink">
            <input type="checkbox" name={k} defaultChecked={f[k]} className="size-5 accent-[#7a4f33]" /> {l}
          </label>
        ))}
        {!isFree && (
          <label className="flex items-center gap-2.5 font-semibold text-ink sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={plan.active} className="size-5 accent-[#7a4f33]" /> Paket bisa dibeli
          </label>
        )}
      </fieldset>
      <SubmitButton>Simpan paket</SubmitButton>
    </form>
  );
}
