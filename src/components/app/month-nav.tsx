import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonthsISO, monthLabel, todayISO } from "@/lib/dates";

/** Navigasi bulan lewat query ?bulan=YYYY-MM (parameter lain dipertahankan) */
export function MonthNav({ month, path, params = {} }: { month: string; path: string; params?: Record<string, string | undefined> }) {
  const href = (m: string) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    q.set("bulan", m.slice(0, 7));
    return `${path}?${q}`;
  };
  const isCurrent = month.slice(0, 7) === todayISO().slice(0, 7);
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-card p-1">
      <Link href={href(addMonthsISO(month, -1))} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-latte-2" aria-label="Bulan sebelumnya">
        <ChevronLeft className="size-5" />
      </Link>
      <span className="min-w-36 text-center font-bold text-ink">{monthLabel(month)}</span>
      <Link href={href(addMonthsISO(month, 1))} className={`grid size-9 place-items-center rounded-xl text-muted hover:bg-latte-2 ${isCurrent ? "pointer-events-none opacity-30" : ""}`} aria-label="Bulan berikutnya" aria-disabled={isCurrent}>
        <ChevronRight className="size-5" />
      </Link>
    </div>
  );
}

/** Ambil bulan dari ?bulan=YYYY-MM, jatuh ke bulan ini bila tidak valid */
export function monthFromParam(v: string | string[] | undefined) {
  const s = typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && v >= "2000-01" && v <= "2100-12" ? v : todayISO().slice(0, 7);
  return `${s}-01`;
}
