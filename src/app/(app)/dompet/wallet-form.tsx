"use client";

import { saveWallet } from "@/lib/actions/finance";
import { useActionForm } from "@/components/app/form-dialog";
import { COLOR_NAMES, COLOR_SWATCH } from "@/components/category-icon";
import { Field, Input, Select, errProps } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function WalletForm({ defaults }: { defaults?: { id: string; name: string; type: string; color: string; initialBalance: number } }) {
  const [, action, err] = useActionForm(saveWallet);
  const [color, setColor] = useState(defaults?.color ?? "caramel");
  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="color" value={color} />
      <Field label="Nama dompet" htmlFor="w-name" error={err.name}>
        <Input id="w-name" name="name" defaultValue={defaults?.name} maxLength={40} placeholder="Contoh: BCA, GoPay, Celengan" autoFocus {...errProps("w-name", err.name)} />
      </Field>
      <Field label="Jenis" htmlFor="w-type">
        <Select id="w-type" name="type" defaultValue={defaults?.type ?? "bank"}>
          <option value="cash">Uang tunai</option>
          <option value="bank">Rekening bank</option>
          <option value="ewallet">Dompet digital (e-wallet)</option>
          <option value="other">Lainnya</option>
        </Select>
      </Field>
      <Field label="Saldo awal" htmlFor="w-init" error={err.initialBalance} hint="Isi saldo saat ini supaya total saldo di Boma sesuai kenyataan. Boleh 0.">
        <MoneyInput id="w-init" name="initialBalance" defaultValue={defaults?.initialBalance} error={err.initialBalance} />
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-ink">Warna</legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_NAMES.map((c) => (
            <button key={c} type="button" aria-pressed={color === c} aria-label={`Warna ${c}`} onClick={() => setColor(c)} className={cn("size-9 rounded-full border-4", color === c ? "border-ink" : "border-card")} style={{ background: COLOR_SWATCH[c] }} />
          ))}
        </div>
      </fieldset>
      <SubmitButton className="w-full">{defaults ? "Simpan perubahan" : "Tambah dompet"}</SubmitButton>
    </form>
  );
}
