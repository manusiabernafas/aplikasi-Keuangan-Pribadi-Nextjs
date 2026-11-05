"use client";

import { Ban, CircleCheck, Crown } from "lucide-react";
import { grantPremium, setUserBanned } from "@/lib/actions/admin";
import { ActionButton } from "@/components/app/confirm-form";
import { FormDialog, useActionForm } from "@/components/app/form-dialog";
import { Field, Input, errProps } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

function GrantForm({ id }: { id: string }) {
  const [, action, err] = useActionForm(grantPremium);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="id" value={id} />
      <Field label="Jumlah hari" htmlFor="gp-days" error={err.days} hint="Angka negatif untuk mengurangi masa Premium.">
        <Input id="gp-days" name="days" type="number" min={-366} max={366} defaultValue={30} {...errProps("gp-days", err.days)} />
      </Field>
      <SubmitButton className="w-full">Simpan</SubmitButton>
    </form>
  );
}

export function UserActions({ id, email, banned, isAdmin }: { id: string; email: string; banned: boolean; isAdmin: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      <FormDialog title={`Atur Premium ${email}`} variant="soft" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-mocha-soft px-3 text-xs font-bold text-mocha hover:bg-latte" trigger={<><Crown className="size-3.5" /> Premium</>}>
        <GrantForm id={id} />
      </FormDialog>
      {!isAdmin && (
        <ActionButton action={setUserBanned} fields={{ id, banned: banned ? "0" : "1" }} variant={banned ? "soft" : "danger-soft"} className="h-9 rounded-xl px-3 text-xs" confirm={banned ? undefined : `Blokir ${email}? Ia akan langsung dikeluarkan.`} pendingText="…">
          {banned ? <><CircleCheck className="size-3.5" /> Aktifkan</> : <><Ban className="size-3.5" /> Blokir</>}
        </ActionButton>
      )}
    </div>
  );
}
