import "server-only";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireBook, type BookContext } from "@/lib/auth/session";
import { rateLimit } from "@/lib/security/rate-limit";

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

export class ActionError extends Error {}

/** Pintu semua aksi data: sesi + buku aktif + batas laju per pengguna. */
export async function bookAction(bucket = "write", max = 60): Promise<BookContext> {
  const ctx = await requireBook();
  const rl = rateLimit(`act:${bucket}:${ctx.user.id}`, max, 60);
  if (!rl.ok) throw new ActionError(`Terlalu cepat. Coba lagi dalam ${rl.retryAfterSeconds} detik.`);
  return ctx;
}

/** Pastikan dompet milik buku ini (mencegah memakai id dari buku orang lain). */
export async function assertWallets(bookId: string, ids: (string | undefined | null)[]) {
  const list = [...new Set(ids.filter(Boolean) as string[])];
  if (!list.length) return;
  const rows = await db.select({ id: schema.wallets.id }).from(schema.wallets).where(and(eq(schema.wallets.bookId, bookId), inArray(schema.wallets.id, list)));
  if (rows.length !== list.length) throw new ActionError("Dompet tidak ditemukan.");
}

export async function assertCategory(bookId: string, id: string | undefined | null, kind?: "income" | "expense") {
  if (!id) return;
  const row = await db.query.categories.findFirst({ where: and(eq(schema.categories.id, id), eq(schema.categories.bookId, bookId)), columns: { kind: true } });
  if (!row) throw new ActionError("Kategori tidak ditemukan.");
  if (kind && row.kind !== kind) throw new ActionError(kind === "income" ? "Pilih kategori pemasukan." : "Pilih kategori pengeluaran.");
}

export function refresh() {
  revalidatePath("/", "layout");
}

/** Bungkus aksi: ActionError -> pesan ramah; galat lain -> pesan umum (detail tidak bocor). */
export async function run(fn: () => Promise<ActionState>): Promise<ActionState> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, message: e.message };
    // redirect()/notFound() dari Next harus diteruskan
    if (e && typeof e === "object" && "digest" in e) throw e;
    console.error("[aksi]", e);
    return { ok: false, message: "Maaf, ada gangguan saat menyimpan. Coba lagi sebentar lagi." };
  }
}
