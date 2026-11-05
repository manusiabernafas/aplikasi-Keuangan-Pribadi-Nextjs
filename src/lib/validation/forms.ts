import { z } from "zod";
import { MAX_AMOUNT, parseRupiah } from "@/lib/money";
import { isValidISODate } from "@/lib/dates";
import { ICON_NAMES, COLOR_NAMES } from "@/components/category-icon";

/** Teks bebas: dipangkas, karakter kontrol dibuang, panjang dibatasi */
export const cleanText = (max: number, label: string) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().max(max, `${label} maksimal ${max} karakter`));

export const requiredText = (max: number, label: string) => cleanText(max, label).pipe(z.string().min(1, `${label} perlu diisi`));

export const amount = (label = "Nominal") =>
  z
    .string({ error: `${label} perlu diisi` })
    .transform((s, ctx) => {
      const v = parseRupiah(s);
      if (v === null) {
        ctx.addIssue({ code: "custom", message: s.trim() ? `${label} belum terbaca. Contoh: 25000 atau 25rb` : `${label} perlu diisi` });
        return z.NEVER;
      }
      if (v <= 0) {
        ctx.addIssue({ code: "custom", message: `${label} harus lebih dari 0` });
        return z.NEVER;
      }
      if (v > MAX_AMOUNT) {
        ctx.addIssue({ code: "custom", message: `${label} terlalu besar` });
        return z.NEVER;
      }
      return v;
    });

export const isoDate = (label = "Tanggal") =>
  z.string({ error: `${label} perlu diisi` }).refine(isValidISODate, `${label} tidak valid`).refine((s) => s >= "2000-01-01" && s <= "2100-12-31", `${label} di luar jangkauan`);

export const uuid = (label: string) => z.uuid(`Pilih ${label} dulu`);
export const optionalUuid = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.uuid().optional());
export const icon = z.enum(ICON_NAMES as [string, ...string[]]).catch("circle");
export const color = z.enum(COLOR_NAMES).catch("caramel");

export const transactionSchema = z
  .object({
    kind: z.enum(["income", "expense", "transfer"], { error: "Pilih jenis transaksi" }),
    amount: amount(),
    walletId: uuid("dompet"),
    toWalletId: optionalUuid,
    categoryId: optionalUuid,
    occurredOn: isoDate(),
    note: cleanText(200, "Catatan").optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "transfer") {
      if (!v.toWalletId) ctx.addIssue({ code: "custom", path: ["toWalletId"], message: "Pilih dompet tujuan" });
      else if (v.toWalletId === v.walletId) ctx.addIssue({ code: "custom", path: ["toWalletId"], message: "Dompet tujuan harus berbeda dari dompet asal" });
    } else if (!v.categoryId) ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Pilih kategori" });
  });

export const walletSchema = z.object({
  name: requiredText(40, "Nama dompet"),
  type: z.enum(["cash", "bank", "ewallet", "other"]).catch("other"),
  color,
  initialBalance: z
    .string()
    .optional()
    .transform((s, ctx) => {
      if (!s?.trim()) return 0;
      const v = parseRupiah(s);
      if (v === null) {
        ctx.addIssue({ code: "custom", message: "Saldo awal belum terbaca. Contoh: 500000 atau 500rb" });
        return z.NEVER;
      }
      return v;
    }),
});

export const categorySchema = z.object({ name: requiredText(40, "Nama kategori"), kind: z.enum(["income", "expense"]), icon, color });
export const budgetSchema = z.object({ categoryId: uuid("kategori"), month: z.string().regex(/^\d{4}-\d{2}$/, "Bulan tidak valid"), amount: amount("Batas anggaran") });
export const goalSchema = z.object({
  name: requiredText(60, "Nama target"),
  targetAmount: amount("Target"),
  deadline: z.preprocess((v) => (v === "" ? undefined : v), isoDate("Tenggat").optional()),
  icon,
  color,
});
export const goalEntrySchema = z.object({
  goalId: uuid("target"),
  direction: z.enum(["in", "out"]),
  amount: amount(),
  occurredOn: isoDate(),
  note: cleanText(120, "Catatan").optional(),
});
export const billSchema = z.object({
  name: requiredText(60, "Nama tagihan"),
  amount: amount(),
  categoryId: optionalUuid,
  walletId: optionalUuid,
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  nextDueOn: isoDate("Jatuh tempo"),
});
export const inviteSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email("Format email belum benar. Contoh: nama@gmail.com").max(200)) });

/** Ubah ZodError ke { field: pesan pertama } */
export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "_");
    out[k] ??= i.message;
  }
  return out;
}

export function formObject(form: FormData) {
  const o: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string" && !k.startsWith("$")) o[k] = v;
  return o;
}
