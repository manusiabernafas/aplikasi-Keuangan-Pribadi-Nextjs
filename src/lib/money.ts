/**
 * Pengurai nominal rupiah yang memaafkan cara orang mengetik:
 * "25000", "25.000", "Rp 25.000", "25rb", "25 ribu", "1,5jt", "1.5 juta", "2m" (miliar).
 * Mengembalikan bilangan bulat rupiah, atau null jika tidak bisa dibaca.
 */
export const MAX_AMOUNT = 999_999_999_999; // < 1 triliun

export function parseRupiah(input: string): number | null {
  let s = input.toLowerCase().replace(/rp\.?/g, "").replace(/\s+/g, "").trim();
  if (!s) return null;
  const units: [RegExp, number][] = [
    [/(miliar|milyar|m)$/, 1e9],
    [/(juta|jt)$/, 1e6],
    [/(ribu|rb|k)$/, 1e3],
  ];
  let mult = 1;
  for (const [re, m] of units) {
    if (re.test(s)) {
      s = s.replace(re, "");
      mult = m;
      break;
    }
  }
  if (!/^[\d.,]+$/.test(s)) return null;
  let n: number;
  if (mult > 1) {
    // dengan satuan, koma/titik terakhir dianggap desimal: 1,5jt / 1.5jt
    n = Number(s.replace(/[.,](?=.*[.,])/g, "").replace(",", "."));
  } else {
    // tanpa satuan: titik & koma dianggap pemisah ribuan (format Indonesia), kecuali ",xx" di akhir = sen
    const cents = s.match(/,(\d{1,2})$/);
    n = Number((cents ? s.slice(0, -cents[0].length) : s).replace(/[.,]/g, ""));
  }
  if (!Number.isFinite(n)) return null;
  const v = Math.round(n * mult);
  return v > 0 && v <= MAX_AMOUNT ? v : v === 0 ? 0 : null;
}

const fmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function formatNumber(n: number) {
  return fmt.format(n);
}

export function formatRupiah(n: number, opts: { sign?: boolean } = {}) {
  const s = `Rp ${fmt.format(Math.abs(n))}`;
  if (n < 0) return `-${s}`;
  return opts.sign && n > 0 ? `+${s}` : s;
}

/** Ringkas: 1.250.000 -> "Rp 1,25 jt" */
export function formatRupiahShort(n: number) {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const f = (v: number) => v.toLocaleString("id-ID", { maximumFractionDigits: v < 10 ? 2 : 1 });
  if (a >= 1e9) return `${sign}Rp ${f(a / 1e9)} M`;
  if (a >= 1e6) return `${sign}Rp ${f(a / 1e6)} jt`;
  if (a >= 1e4) return `${sign}Rp ${f(a / 1e3)} rb`;
  return `${sign}Rp ${fmt.format(a)}`;
}
