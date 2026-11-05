"use client";

import { useActionState } from "react";
import { acceptInvite } from "@/lib/actions/account";
import { SubmitButton } from "@/components/ui/submit-button";

export function AcceptForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvite, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="token" value={token} />
      {state?.message && !state.ok && <p role="alert" className="rounded-2xl bg-expense-soft px-4 py-3 text-sm font-semibold text-expense">{state.message}</p>}
      <SubmitButton className="w-full" pendingText="Bergabung…">Terima undangan</SubmitButton>
    </form>
  );
}
