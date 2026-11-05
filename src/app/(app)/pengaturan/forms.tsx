"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { deleteAccount, updateProfile } from "@/lib/actions/account";
import { Field, Input, errProps } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({ name, bookName, isOwner }: { name: string; bookName: string; isOwner: boolean }) {
  const [state, action] = useActionState(updateProfile, null);
  const err = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) toast.success(state.message);
    else if (state?.message) toast.error(state.message);
  }, [state]);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Nama panggilan" htmlFor="p-name" error={err.name} hint="Dipakai Boma untuk menyapamu.">
        <Input id="p-name" name="name" defaultValue={name} maxLength={60} {...errProps("p-name", err.name)} />
      </Field>
      {isOwner && (
        <Field label="Nama buku keuangan" htmlFor="p-book" error={err.bookName}>
          <Input id="p-book" name="bookName" defaultValue={bookName} maxLength={60} {...errProps("p-book", err.bookName)} />
        </Field>
      )}
      <SubmitButton>Simpan</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm({ email }: { email: string }) {
  const [state, action] = useActionState(deleteAccount, null);
  const err = state?.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate onSubmit={(e) => { if (!window.confirm("Yakin hapus akun dan SEMUA data keuanganmu secara permanen?")) e.preventDefault(); }}>
      <Field label={`Ketik email kamu (${email}) untuk konfirmasi`} htmlFor="del-confirm" error={err.confirm}>
        <Input id="del-confirm" name="confirm" autoComplete="off" placeholder={email} {...errProps("del-confirm", err.confirm)} />
      </Field>
      {state?.message && <p role="alert" className="text-sm font-semibold text-expense">{state.message}</p>}
      <SubmitButton variant="danger" pendingText="Menghapus…">Hapus akun permanen</SubmitButton>
    </form>
  );
}
