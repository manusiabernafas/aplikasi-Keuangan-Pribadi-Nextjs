"use client";

import { useState } from "react";
import { formatNumber, formatRupiah, parseRupiah } from "@/lib/money";
import { cn } from "@/lib/utils";
import { inputClass } from "./field";

/**
 * Input nominal yang manusiawi: boleh ketik "25rb", "1,5jt", atau "25.000".
 * Angka biasa langsung diberi titik ribuan; singkatan ditampilkan hasil bacanya di bawah.
 */
export function MoneyInput({ id, name, defaultValue, error, autoFocus, placeholder = "0", quick }: { id: string; name: string; defaultValue?: number; error?: string; autoFocus?: boolean; placeholder?: string; quick?: number[] }) {
  const [text, setText] = useState(defaultValue ? formatNumber(defaultValue) : "");
  const parsed = parseRupiah(text);
  const shorthand = /[a-z]/i.test(text.replace(/rp/i, ""));

  function onChange(v: string) {
    // Angka murni: format ulang dengan titik ribuan supaya mudah dibaca
    if (/^[\d.]*$/.test(v)) {
      const digits = v.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 12);
      setText(digits ? formatNumber(Number(digits)) : "");
    } else setText(v.slice(0, 24));
  }

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-bold text-muted">Rp</span>
        <input
          id={id}
          name={name}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputClass, "pl-12 font-display text-xl font-bold tabular-nums")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
        />
      </div>
      <p id={`${id}-hint`} className="mt-1.5 min-h-5 text-sm text-muted" aria-live="polite">
        {error ? null : text && shorthand ? (parsed ? <>Terbaca: <b className="text-ink">{formatRupiah(parsed)}</b></> : <span className="text-expense">Nominal belum terbaca, coba &quot;25000&quot; atau &quot;25rb&quot;</span>) : !text ? "Bisa ketik singkat: 25rb, 1,5jt" : null}
      </p>
      {quick && (
        <div className="mt-1 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => setText(formatNumber(q))} className="rounded-full border border-line bg-cream px-3 py-1 text-xs font-bold text-mocha hover:border-caramel">
              {formatRupiah(q)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
