"use client";

import { saveCategory } from "@/lib/actions/finance";
import { useActionForm } from "@/components/app/form-dialog";
import { ICON_NAMES } from "@/components/category-icon";
import { Field, Input, errProps } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { IconColorPicker } from "../tabungan/goal-forms";

export function CategoryForm({ kind, defaults }: { kind: "income" | "expense"; defaults?: { id: string; name: string; icon: string; color: string } }) {
  const [, action, err] = useActionForm(saveCategory);
  return (
    <form action={action} className="space-y-5" noValidate>
      {defaults && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="kind" value={kind} />
      <Field label="Nama kategori" htmlFor="c-name" error={err.name}>
        <Input id="c-name" name="name" defaultValue={defaults?.name} maxLength={40} placeholder={kind === "expense" ? "Contoh: Jajan kucing" : "Contoh: Freelance"} autoFocus {...errProps("c-name", err.name)} />
      </Field>
      <IconColorPicker icons={ICON_NAMES} defaultIcon={defaults?.icon ?? "circle"} defaultColor={defaults?.color ?? (kind === "income" ? "income" : "caramel")} />
      <SubmitButton className="w-full">{defaults ? "Simpan perubahan" : "Tambah kategori"}</SubmitButton>
    </form>
  );
}
