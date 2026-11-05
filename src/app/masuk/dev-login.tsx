"use client";

import { useActionState } from "react";
import { devLogin } from "./actions";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function DevLogin() {
  const [state, action] = useActionState(devLogin, null);
  return (
    <form action={action} className="space-y-3 rounded-2xl border-2 border-dashed border-caramel/60 bg-caramel-soft p-4">
      <p className="text-xs font-bold tracking-wide text-mocha uppercase">Mode uji lokal</p>
      <Input name="email" type="email" placeholder="email uji" autoComplete="off" required aria-label="Email uji" />
      <Input name="password" type="password" placeholder="sandi uji (min 8)" autoComplete="off" required aria-label="Sandi uji" />
      <Input name="name" placeholder="nama (untuk akun baru)" autoComplete="off" aria-label="Nama" />
      {state?.error && <p className="text-sm font-semibold text-expense">{state.error}</p>}
      <SubmitButton className="w-full" pendingText="Masuk…">Masuk uji</SubmitButton>
    </form>
  );
}
