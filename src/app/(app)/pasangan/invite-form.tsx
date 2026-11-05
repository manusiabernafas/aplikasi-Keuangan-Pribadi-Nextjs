"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle, Send } from "lucide-react";
import { invitePartner, type InviteState } from "@/lib/actions/account";
import { Field, Input, errProps } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";

export function InviteForm() {
  const [state, action] = useActionState<InviteState, FormData>(invitePartner, null);
  const [copied, setCopied] = useState(false);
  const err = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) toast.success(state.message);
    else if (state?.message) toast.error(state.message);
  }, [state]);

  if (state?.ok && state.link) {
    const wa = `https://wa.me/?text=${encodeURIComponent(`Yuk kelola keuangan bareng aku di Boma. Terima undangannya di sini: ${state.link}`)}`;
    return (
      <div className="space-y-3">
        <p className="font-semibold text-ink">Tautan undangan (berlaku 7 hari, hanya untuk email yang diundang):</p>
        <div className="rounded-2xl border-2 border-dashed border-latte bg-cream px-4 py-3 font-mono text-sm break-all text-ink">{state.link}</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass()}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.link!);
                setCopied(true);
              } catch {
                toast.error("Gagal menyalin. Salin manual tautannya ya.");
              }
            }}
          >
            <Copy className="size-4" /> {copied ? "Tersalin" : "Salin tautan"}
          </button>
          <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: "secondary" })}>
            <MessageCircle className="size-4" /> Kirim lewat WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
      <Field label="Email Google pasanganmu" htmlFor="inv-email" error={err.email} className="flex-1" hint="Pasanganmu harus masuk dengan akun Google yang memakai email ini.">
        <Input id="inv-email" name="email" type="email" inputMode="email" autoComplete="off" maxLength={200} placeholder="nama@gmail.com" {...errProps("inv-email", err.email)} />
      </Field>
      <SubmitButton className="sm:mt-7" pendingText="Membuat…">
        <Send className="size-4" /> Buat undangan
      </SubmitButton>
    </form>
  );
}
