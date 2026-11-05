import { ChevronsUpDown, Check } from "lucide-react";
import { switchBook } from "@/lib/actions/account";

export function BookSwitcher({ current, books }: { current: { id: string; name: string }; books: { id: string; name: string; role: "owner" | "partner" }[] }) {
  if (books.length < 2)
    return (
      <div className="rounded-2xl bg-cream-2 px-3.5 py-2.5">
        <p className="text-xs font-semibold text-muted">Buku keuangan</p>
        <p className="truncate font-bold text-ink">{current.name}</p>
      </div>
    );
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl bg-cream-2 px-3.5 py-2.5 hover:bg-latte-2 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-muted">Buku keuangan</span>
          <span className="block truncate font-bold text-ink">{current.name}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted" />
      </summary>
      <div className="absolute inset-x-0 z-50 mt-2 rounded-2xl border border-line bg-card p-1.5 shadow-lg">
        {books.map((b) => (
          <form key={b.id} action={switchBook}>
            <input type="hidden" name="bookId" value={b.id} />
            <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-latte-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{b.name}</span>
                <span className="text-xs text-muted">{b.role === "owner" ? "Milikmu" : "Bersama pasangan"}</span>
              </span>
              {b.id === current.id && <Check className="size-4 text-mocha" />}
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}
