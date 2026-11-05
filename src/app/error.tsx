"use client";

import { BomaCat } from "@/components/illustrations/boma-cat";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <BomaCat pose="sleep" className="w-40" title="" />
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Waduh, ada yang tersendat</h1>
      <p className="mt-2 max-w-sm text-muted">Datamu aman. Coba muat ulang sebentar lagi. Kalau masih terjadi, kabari kami ya.</p>
      <Button onClick={reset} className="mt-6">Coba lagi</Button>
    </div>
  );
}
