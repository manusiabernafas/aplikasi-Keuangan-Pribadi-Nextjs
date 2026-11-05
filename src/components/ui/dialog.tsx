"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dialog modal berbasis <dialog> bawaan browser (fokus & Esc sudah ditangani browser). */
export function Dialog({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-auto w-[calc(100%-1.5rem)] max-w-lg rounded-3xl border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-[#3a2a20]/45 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none",
        className,
      )}
      aria-labelledby={titleId}
    >
      {open && (
        <div className="max-h-[88dvh] overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 id={titleId} className="text-xl font-extrabold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-muted hover:bg-latte-2" aria-label="Tutup">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
