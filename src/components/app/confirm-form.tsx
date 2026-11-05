"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/actions/common";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonVariant } from "@/components/ui/button";

/** Form satu tombol untuk aksi kecil (hapus, arsip, dll) dengan konfirmasi opsional */
export function ActionButton({
  action,
  fields,
  children,
  confirm,
  variant = "ghost",
  pendingText = "Memproses…",
  className,
  onDone,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  fields: Record<string, string>;
  children: React.ReactNode;
  confirm?: string;
  variant?: ButtonVariant;
  pendingText?: string;
  className?: string;
  onDone?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onDone?.();
    } else if (state?.message) toast.error(state.message);
  }, [state, onDone]);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} pendingText={pendingText} className={className}>
        {children}
      </SubmitButton>
    </form>
  );
}
