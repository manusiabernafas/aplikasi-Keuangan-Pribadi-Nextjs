"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { buttonClass, type ButtonVariant } from "./button";

export function SubmitButton({ children, pendingText = "Menyimpan…", variant = "primary", className, name, value }: { children: React.ReactNode; pendingText?: string; variant?: ButtonVariant; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-busy={pending} className={buttonClass({ variant, className })}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" /> {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
