"use client";

import { useState } from "react";
import { addGoalEntry, saveGoal } from "@/lib/actions/finance";
import { useActionForm } from "@/components/app/form-dialog";
import { CategoryIcon, COLOR_NAMES, COLOR_SWATCH } from "@/components/category-icon";
import { Field, Input, errProps } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

const GOAL_ICONS = ["target", "plane", "home", "car", "graduation-cap", "baby", "smartphone", "laptop", "gift", "heart-pulse", "piggy-bank", "sparkles"];

export function IconColorPicker({ icons, defaultIcon, defaultColor }: { icons: string[]; defaultIcon: string; defaultColor: string }) {
  const [icon, setIcon] = useState(defaultIcon);
  const [color, setColor] = useState(defaultColor);
  return (
    <div className="space-y-3">
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Ikon</legend>
        <div className="flex flex-wrap gap-2">
          {icons.map((i) => (
            <button key={i} type="button" aria-pressed={icon === i} aria-label={i} onClick={() => setIcon(i)} className={cn("rounded-2xl border-2 p-1", icon === i ? "border-mocha" : "border-transparent")}>
              <CategoryIcon icon={i} color={color} />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Warna</legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_NAMES.map((c) => (
            <button key={c} type="button" aria-pressed={color === c} aria-label={`Warna ${c}`} onClick={() => setColor(c)} className={cn("size-9 rounded-full border-4", color === c ? "border-ink" : "border-card")} style={{ background: COLOR_SWATCH[c] }} />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function GoalForm({ defaults }: { defaults?: { id: string; name: string; targetAmount: number; deadline: string | null; icon: string; color: string } }) {
  const [, action, err] = useActionForm(saveGoal);
  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <Field label="Nama target" htmlFor="g-name" error={err.name}>
        <Input id="g-name" name="name" defaultValue={defaults?.name} maxLength={60} placeholder="Contoh: Liburan ke Bali, Dana darurat" autoFocus {...errProps("g-name", err.name)} />
      </Field>
      <Field label="Jumlah yang ingin dikumpulkan" htmlFor="g-target" error={err.targetAmount}>
        <MoneyInput id="g-target" name="targetAmount" defaultValue={defaults?.targetAmount} error={err.targetAmount} />
      </Field>
      <Field label="Tenggat" htmlFor="g-deadline" optional error={err.deadline} hint="Boma akan menghitung berapa yang perlu disisihkan tiap bulan.">
        <Input id="g-deadline" name="deadline" type="date" min={todayISO()} max="2100-12-31" defaultValue={defaults?.deadline ?? ""} {...errProps("g-deadline", err.deadline)} />
      </Field>
      <IconColorPicker icons={GOAL_ICONS} defaultIcon={defaults?.icon ?? "target"} defaultColor={defaults?.color ?? "caramel"} />
      <SubmitButton className="w-full">{defaults ? "Simpan perubahan" : "Buat target"}</SubmitButton>
    </form>
  );
}

export function GoalEntryForm({ goalId, direction, max }: { goalId: string; direction: "in" | "out"; max?: number }) {
  const [, action, err] = useActionForm(addGoalEntry);
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="direction" value={direction} />
      <Field label={direction === "in" ? "Nominal setoran" : "Nominal penarikan"} htmlFor="ge-amount" error={err.amount} hint={max !== undefined ? `Saldo target saat ini Rp ${max.toLocaleString("id-ID")}` : undefined}>
        <MoneyInput id="ge-amount" name="amount" error={err.amount} autoFocus quick={direction === "in" ? [50000, 100000, 500000] : undefined} />
      </Field>
      <Field label="Tanggal" htmlFor="ge-date" error={err.occurredOn}>
        <Input id="ge-date" name="occurredOn" type="date" max="2100-12-31" defaultValue={todayISO()} {...errProps("ge-date", err.occurredOn)} />
      </Field>
      <Field label="Catatan" htmlFor="ge-note" optional error={err.note}>
        <Input id="ge-note" name="note" maxLength={120} placeholder={direction === "in" ? "Contoh: sisa uang jajan" : "Contoh: bayar DP tiket"} />
      </Field>
      <SubmitButton className="w-full" variant={direction === "in" ? "primary" : "danger"}>{direction === "in" ? "Setor" : "Tarik"}</SubmitButton>
    </form>
  );
}
