/** Semua tanggal bisnis memakai zona Asia/Jakarta (WIB), disimpan sebagai "YYYY-MM-DD". */
export const TZ = "Asia/Jakarta";

export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Tambah bulan dengan menjaga tanggal (31 Jan + 1 bln = 28/29 Feb) */
export function addMonthsISO(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
}

export function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function monthEnd(iso: string) {
  return addDaysISO(addMonthsISO(monthStart(iso), 1), -1);
}

export function isValidISODate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function monthLabel(iso: string, short = false) {
  const [y, m] = iso.split("-").map(Number);
  return `${(short ? BLN : BULAN)[m - 1]} ${y}`;
}

export function dateLabel(iso: string, opts: { weekday?: boolean; year?: boolean } = {}) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = HARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${opts.weekday ? wd + ", " : ""}${d} ${BLN[m - 1]}${opts.year === false ? "" : " " + y}`;
}

/** "Hari ini", "Kemarin", atau tanggal */
export function relativeDayLabel(iso: string, today = todayISO()) {
  if (iso === today) return "Hari ini";
  if (iso === addDaysISO(today, -1)) return "Kemarin";
  if (iso === addDaysISO(today, 1)) return "Besok";
  return dateLabel(iso, { weekday: true, year: iso.slice(0, 4) !== today.slice(0, 4) });
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000);
}

export function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hour12: false }).format(now));
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}
