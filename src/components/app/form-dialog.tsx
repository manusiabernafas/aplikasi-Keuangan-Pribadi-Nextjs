"use client";

import { createContext, useActionState, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { buttonClass, type ButtonVariant } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/common";

const CloseCtx = createContext<() => void>(() => {});

/** Tombol pemicu + dialog. Form di dalamnya bisa menutup dialog lewat useActionForm. */
export function FormDialog({ trigger, title, children, variant = "primary", className, triggerLabel }: { trigger: React.ReactNode; title: string; children: React.ReactNode; variant?: ButtonVariant; className?: string; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        aria-label={triggerLabel}
        className={className ?? buttonClass({ variant })}
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
      >
        {trigger}
      </button>
      <Dialog open={open} onClose={close} title={title}>
        <CloseCtx.Provider value={close}>
          <div key={key}>{children}</div>
        </CloseCtx.Provider>
      </Dialog>
    </>
  );
}

/** useActionState + toast + tutup dialog saat sukses */
export function useActionForm<S extends ActionState>(action: (s: S | null, f: FormData) => Promise<S | null>, opts: { keepOpen?: boolean } = {}) {
  const close = useContext(CloseCtx);
  const [state, formAction] = useActionState<S | null, FormData>(action, null);
  useEffect(() => {
    if (state?.ok) {
      if (state.message) toast.success(state.message);
      if (!opts.keepOpen) close();
    } else if (state?.message) toast.error(state.message);
  }, [state, close, opts.keepOpen]);
  return [state, formAction, state?.errors ?? {}] as const;
}
