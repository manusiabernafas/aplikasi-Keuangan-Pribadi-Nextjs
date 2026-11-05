"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TransactionForm, type CatOpt, type WalletOpt } from "./transaction-form";

export function QuickAdd({ wallets, categories, variant = "button", className }: { wallets: WalletOpt[]; categories: CatOpt[]; variant?: "button" | "fab"; className?: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(0);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setKey((k) => k + 1);
          setOpen(true);
        }}
        className={cn(
          variant === "fab"
            ? "grid size-14 place-items-center rounded-full bg-mocha text-white shadow-[0_10px_24px_-8px_rgba(122,79,51,0.7)] hover:bg-mocha-hover"
            : "inline-flex h-11 items-center gap-2 rounded-2xl bg-mocha px-4 text-sm font-bold text-white hover:bg-mocha-hover",
          className,
        )}
        aria-label="Catat transaksi"
      >
        <Plus className={variant === "fab" ? "size-7" : "size-5"} strokeWidth={2.6} />
        {variant === "button" && "Catat transaksi"}
      </button>
      <Dialog open={open} onClose={close} title="Catat transaksi">
        <TransactionForm key={key} wallets={wallets} categories={categories} onDone={close} />
      </Dialog>
    </>
  );
}
