import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAuth } from "./auth";
import { ensurePersonalBook } from "@/lib/server/books";
import { getUserEntitlement } from "@/lib/server/plans";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "super_admin";
};

/** Satu-satunya pintu membaca sesi. Di-cache per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // headers() dulu: menandai halaman dinamis sebelum konfigurasi auth dibaca (penting saat build)
  const h = await headers();
  const session = await getAuth().api.getSession({ headers: h });
  if (!session) return null;
  const u = await db.query.users.findFirst({
    where: eq(schema.users.id, session.user.id),
    columns: { id: true, name: true, email: true, image: true, role: true, banned: true },
  });
  if (!u || u.banned) return null;
  return { id: u.id, name: u.name, email: u.email, image: u.image, role: u.role };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/masuk");
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  // 404 (bukan 403) supaya keberadaan panel admin tidak terungkap
  if (user.role !== "super_admin") notFound();
  return user;
}

export type BookContext = {
  user: SessionUser;
  book: { id: string; name: string; ownerId: string };
  role: "owner" | "partner";
};

/**
 * Buku aktif milik pengguna + perannya di buku itu. Semua query data keuangan
 * WAJIB difilter dengan book.id dari sini, sehingga tidak ada akses lintas buku.
 */
export const requireBook = cache(async (): Promise<BookContext> => {
  const user = await requireUser();
  const pick = async (bookId: string | null) => {
    if (!bookId) return null;
    const rows = await db
      .select({ id: schema.books.id, name: schema.books.name, ownerId: schema.books.ownerId, role: schema.bookMembers.role })
      .from(schema.bookMembers)
      .innerJoin(schema.books, eq(schema.books.id, schema.bookMembers.bookId))
      .where(and(eq(schema.bookMembers.userId, user.id), eq(schema.bookMembers.bookId, bookId)))
      .limit(1);
    return rows[0] ?? null;
  };
  const me = await db.query.users.findFirst({ where: eq(schema.users.id, user.id), columns: { activeBookId: true } });
  let row = await pick(me?.activeBookId ?? null);
  // Akses pasangan hanya berlaku selama pemilik buku masih Premium
  if (row?.role === "partner" && !(await getUserEntitlement(row.ownerId)).features.partner) row = null;
  if (!row) {
    const own = await ensurePersonalBook(user.id, user.name);
    await db.update(schema.users).set({ activeBookId: own }).where(eq(schema.users.id, user.id));
    row = await pick(own);
  }
  if (!row) throw new Error("Buku tidak ditemukan");
  return { user, book: { id: row.id, name: row.name, ownerId: row.ownerId }, role: row.role };
});
