import { formatRupiah, formatRupiahShort } from "@/lib/money";
import { COLOR_SWATCH, type ColorName } from "@/components/category-icon";

/** Grafik batang sederhana (SVG murni, tanpa library). Batang tertinggi diberi warna utama. */
export function BarChart({ data, height = 160, highlight, label }: { data: { label: string; value: number; title?: string }[]; height?: number; highlight?: number; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hi = highlight ?? data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);
  const step = Math.max(1, Math.ceil(data.length / 10));
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-[3px] sm:gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end">
            <div
              className={`w-full rounded-t-md transition-colors ${i === hi && d.value > 0 ? "bg-mocha" : "bg-latte group-hover:bg-caramel"}`}
              style={{ height: `${Math.max(d.value > 0 ? 3 : 1.5, (d.value / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-[11px] font-bold whitespace-nowrap text-white group-hover:block">
              {d.title ?? d.label}: {formatRupiah(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] text-[10px] font-semibold text-muted sm:gap-1.5" aria-hidden>
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center">
            {i % step === 0 ? d.label : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.title ?? d.label}</td>
              <td>{formatRupiah(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Donat komposisi; warna diambil dari warna kategori */
export function Donut({ data, size = 168, center }: { data: { name: string; value: number; color: string }[]; size?: number; center?: { label: string; value: string } }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 42;
  const K = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--latte-2)" strokeWidth="14" />
        {total > 0 &&
          data.map((d, i) => {
            const len = (d.value / total) * K;
            const el = <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={COLOR_SWATCH[d.color as ColorName] ?? "#ead8c6"} strokeWidth="14" strokeDasharray={`${Math.max(0, len - (data.length > 1 ? 1.2 : 0))} ${K}`} strokeDashoffset={-off} />;
            off += len;
            return el;
          })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold text-muted">{center.label}</span>
          <span className="font-display text-base font-extrabold text-ink">{center.value}</span>
        </div>
      )}
    </div>
  );
}

/** Pemasukan vs pengeluaran per bulan (dua batang berdampingan) */
export function TrendChart({ data, height = 180 }: { data: { label: string; income: number; expense: number }[]; height?: number }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <figure aria-label="Pemasukan dan pengeluaran per bulan">
      <div className="flex items-end gap-3 sm:gap-5" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex h-full flex-1 items-end justify-center gap-1">
            {(["income", "expense"] as const).map((k) => (
              <div key={k} className="group relative flex h-full w-full max-w-5 items-end">
                <div className={`w-full rounded-t-md ${k === "income" ? "bg-income" : "bg-caramel"}`} style={{ height: `${Math.max(d[k] > 0 ? 3 : 1, (d[k] / max) * 100)}%` }} />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-[11px] font-bold whitespace-nowrap text-white group-hover:block">
                  {k === "income" ? "Masuk" : "Keluar"} {formatRupiahShort(d[k])}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 text-[11px] font-semibold text-muted sm:gap-5" aria-hidden>
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-income" /> Pemasukan</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-caramel" /> Pengeluaran</span>
      </div>
      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.label}><td>{d.label}</td><td>Masuk {formatRupiah(d.income)}</td><td>Keluar {formatRupiah(d.expense)}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
