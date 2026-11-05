"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { startCheckout } from "@/lib/actions/billing";
import { SubmitButton } from "@/components/ui/submit-button";

export function PayButton({ label }: { label: string }) {
  const [state, action] = useActionState(startCheckout, null);
  return (
    <form action={action} className="space-y-2">
      <SubmitButton className="h-13 w-full text-base" pendingText="Membuka halaman pembayaran…">
        {label} <ArrowRight className="size-5" />
      </SubmitButton>
      {state?.message && <p role="alert" className="text-sm font-semibold text-expense">{state.message}</p>}
    </form>
  );
}
