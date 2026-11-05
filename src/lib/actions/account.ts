"use server";

import { createHash, randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { getAuth } from "@/lib/auth/auth";
import { requireUser } from "@/lib/auth/session";
import { serverEnv } from "@/lib/env.server";
import { getUserEntitlement } from "@/lib/server/plans";
import { audit } from "@/lib/server/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors, inviteSchema, requiredText } from "@/lib/validation/forms";
import { ActionError, bookAction, refresh, run, type ActionState } from "./common";

const INVITE_DAYS = 7;
const MAX_PARTNERS = 1;
const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export type InviteState = (ActionState & { link?: string }) | null;

/** Pemilik (Premium) mengundang 1 pasangan. Undangan terikat ke email yang diundang. */
export async function invitePartner(_: InviteState, form: FormData): Promise<InviteState> {
  return run(async () => {
    const { book, user, role } = await bookAction("invite", 10);
    if (role !== "owner") throw new ActionError("Hanya pemilik buku yang bisa mengundang pasangan.");
    const ent = await getUserEntitlement(user.id);
    if (!ent.features.partner) throw new ActionError("Mengajak pasangan adalah fitur Premium.");
    const parsed = inviteSchema.safeParse({ email: form.get("email") });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const email = parsed.data.email;
    if (email === user.email.toLowerCase()) throw new ActionError("Itu email kamu sendiri. Masukkan email pasanganmu.");
    const [m] = await db.select({ c: sql<string>`count(*)` }).from(schema.bookMembers).where(and(eq(schema.bookMembers.bookId, book.id), eq(schema.bookMembers.role, "partner")));
    if (Number(m.c) >= MAX_PARTNERS) throw new ActionError("Buku ini sudah punya pasangan. Keluarkan dulu jika ingin mengganti.");

    const token = randomBytes(32).toString("base64url");
    await db.transaction(async (tx) => {
      // undangan lama yang masih menunggu dibatalkan, hanya satu yang aktif
      await tx.update(schema.invitations).set({ status: "revoked" }).where(and(eq(schema.invitations.bookId, book.id), eq(schema.invitations.status, "pending")));
      await tx.insert(schema.invitations).values({ bookId: book.id, email, tokenHash: hash(token), invitedBy: user.id, expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) });
    });
    await audit(user.id, "partner.invite", book.id, { email });
    refresh();
    return { ok: true, message: "Undangan dibuat. Kirim tautannya ke pasanganmu.", link: `${serverEnv().APP_URL}/undangan/${token}` };
  }) as Promise<InviteState>;
}

export async function revokeInvite(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book, role } = await bookAction();
    if (role !== "owner") throw new ActionError("Hanya pemilik buku yang bisa membatalkan undangan.");
    const id = z.uuid().safeParse(form.get("id"));
    if (!id.success) throw new ActionError("Undangan tidak ditemukan.");
    await db.update(schema.invitations).set({ status: "revoked" }).where(and(eq(schema.invitations.id, id.data), eq(schema.invitations.bookId, book.id)));
    refresh();
    return { ok: true, message: "Undangan dibatalkan." };
  });
}

/** Dipanggil dari halaman /undangan/[token] oleh orang yang diundang */
export async function acceptInvite(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireUser();
    const rl = rateLimit(`accept:${user.id}`, 10, 600);
    if (!rl.ok) throw new ActionError("Terlalu banyak percobaan. Coba lagi nanti.");
    const token = String(form.get("token") ?? "");
    if (!/^[\w-]{20,80}$/.test(token)) throw new ActionError("Tautan undangan tidak valid.");
    const inv = await db.query.invitations.findFirst({
      where: and(eq(schema.invitations.tokenHash, hash(token)), eq(schema.invitations.status, "pending"), gt(schema.invitations.expiresAt, new Date())),
    });
    if (!inv) throw new ActionError("Undangan sudah tidak berlaku. Minta pasanganmu mengirim undangan baru.");
    if (inv.email.toLowerCase() !== user.email.toLowerCase()) throw new ActionError(`Undangan ini untuk ${inv.email}. Masuk dengan akun Google tersebut untuk menerimanya.`);
    const book = await db.query.books.findFirst({ where: eq(schema.books.id, inv.bookId) });
    if (!book) throw new ActionError("Buku keuangan sudah tidak ada.");
    if (book.ownerId === user.id) throw new ActionError("Kamu pemilik buku ini.");
    if (!(await getUserEntitlement(book.ownerId)).features.partner) throw new ActionError("Paket Premium pengundang sudah berakhir, jadi undangan belum bisa diterima.");

    await db.transaction(async (tx) => {
      const [c] = await tx.select({ c: sql<string>`count(*)` }).from(schema.bookMembers).where(and(eq(schema.bookMembers.bookId, book.id), eq(schema.bookMembers.role, "partner")));
      if (Number(c.c) >= MAX_PARTNERS) throw new ActionError("Buku ini sudah punya pasangan.");
      await tx.insert(schema.bookMembers).values({ bookId: book.id, userId: user.id, role: "partner" }).onConflictDoNothing();
      await tx.update(schema.invitations).set({ status: "accepted" }).where(eq(schema.invitations.id, inv.id));
      await tx.update(schema.users).set({ activeBookId: book.id }).where(eq(schema.users.id, user.id));
    });
    await audit(user.id, "partner.accept", book.id);
    refresh();
    redirect("/dasbor?bergabung=1");
  });
}

/** Pemilik mengeluarkan pasangan, atau pasangan keluar sendiri */
export async function removeMember(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book, user, role } = await bookAction();
    const target = z.uuid().safeParse(form.get("userId"));
    if (!target.success) throw new ActionError("Anggota tidak ditemukan.");
    const self = target.data === user.id;
    if (!self && role !== "owner") throw new ActionError("Hanya pemilik buku yang bisa mengeluarkan anggota.");
    if (target.data === book.ownerId) throw new ActionError("Pemilik buku tidak bisa dikeluarkan.");
    await db.delete(schema.bookMembers).where(and(eq(schema.bookMembers.bookId, book.id), eq(schema.bookMembers.userId, target.data), eq(schema.bookMembers.role, "partner")));
    await db.update(schema.users).set({ activeBookId: null }).where(and(eq(schema.users.id, target.data), eq(schema.users.activeBookId, book.id)));
    await audit(user.id, self ? "partner.leave" : "partner.remove", book.id, { userId: target.data });
    refresh();
    if (self) redirect("/dasbor");
    return { ok: true, message: "Pasangan dikeluarkan dari buku ini." };
  });
}

/** Pindah buku aktif (buku sendiri <-> buku pasangan) */
export async function switchBook(form: FormData) {
  const user = await requireUser();
  const id = z.uuid().safeParse(form.get("bookId"));
  if (!id.success) return;
  const member = await db.query.bookMembers.findFirst({ where: and(eq(schema.bookMembers.bookId, id.data), eq(schema.bookMembers.userId, user.id)) });
  if (!member) return;
  await db.update(schema.users).set({ activeBookId: id.data }).where(eq(schema.users.id, user.id));
  refresh();
  redirect("/dasbor");
}

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { user, book, role } = await bookAction();
    const parsed = z.object({ name: requiredText(60, "Nama"), bookName: requiredText(60, "Nama buku").optional() }).safeParse({ name: form.get("name"), bookName: form.get("bookName") ?? undefined });
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    await db.update(schema.users).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
    if (parsed.data.bookName && role === "owner") await db.update(schema.books).set({ name: parsed.data.bookName }).where(eq(schema.books.id, book.id));
    refresh();
    return { ok: true, message: "Profil disimpan." };
  });
}

/** Hapus akun permanen. Wajib mengetik ulang email sebagai konfirmasi. */
export async function deleteAccount(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const user = await requireUser();
    const confirm = String(form.get("confirm") ?? "").trim().toLowerCase();
    if (confirm !== user.email.toLowerCase()) return { ok: false, errors: { confirm: "Ketik email kamu persis untuk konfirmasi." } };
    if (user.role === "super_admin") throw new ActionError("Akun super admin tidak bisa dihapus dari sini.");
    await audit(null, "account.delete", user.id);
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
    try {
      await getAuth().api.signOut({ headers: await headers() });
    } catch {
      // sesi sudah ikut terhapus
    }
    redirect("/?akun=dihapus");
  });
}

export async function signOut() {
  try {
    await getAuth().api.signOut({ headers: await headers() });
  } catch {
    // sudah keluar
  }
  redirect("/");
}
