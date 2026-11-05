"use server";

import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { addDaysISO, addMonthsISO, todayISO } from "@/lib/dates";
import { getBookEntitlement } from "@/lib/server/plans";
import {
  billSchema,
  budgetSchema,
  categorySchema,
  fieldErrors,
  formObject,
  goalEntrySchema,
  goalSchema,
  transactionSchema,
  walletSchema,
} from "@/lib/validation/forms";
import { z } from "zod";
import { ActionError, assertCategory, assertWallets, bookAction, refresh, run, type ActionState } from "./common";

const idSchema = z.uuid();
function parseId(v: FormDataEntryValue | null) {
  const r = idSchema.safeParse(v);
  if (!r.success) throw new ActionError("Data tidak ditemukan.");
  return r.data;
}

/* ───────── Transaksi ───────── */

export async function saveTransaction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book, user } = await bookAction();
    const raw = formObject(form);
    const parsed = transactionSchema.safeParse(raw);
    if (!parsed.success) {
      // Tampilkan semua kesalahan sekaligus (zod melewati cek lanjutan bila ada field dasar yang gagal)
      const errors = fieldErrors(parsed.error);
      if (raw.kind === "transfer" && !raw.toWalletId) errors.toWalletId ??= "Pilih dompet tujuan";
      if ((raw.kind === "income" || raw.kind === "expense") && !raw.categoryId) errors.categoryId ??= "Pilih kategori";
      return { ok: false, errors };
    }
    const v = parsed.data;
    const isTransfer = v.kind === "transfer";
    await assertWallets(book.id, [v.walletId, isTransfer ? v.toWalletId : null]);
    if (v.kind !== "transfer") await assertCategory(book.id, v.categoryId, v.kind);
    const values = {
      kind: v.kind,
      amount: v.amount,
      walletId: v.walletId,
      toWalletId: isTransfer ? v.toWalletId! : null,
      categoryId: isTransfer ? null : v.categoryId!,
      occurredOn: v.occurredOn,
      note: v.note || null,
    };
    const id = form.get("id");
    if (id) {
      const res = await db
        .update(schema.transactions)
        .set({ ...values, updatedAt: new Date() })
        .where(and(eq(schema.transactions.id, parseId(id)), eq(schema.transactions.bookId, book.id)))
        .returning({ id: schema.transactions.id });
      if (!res.length) throw new ActionError("Transaksi tidak ditemukan.");
    } else {
      await db.insert(schema.transactions).values({ ...values, bookId: book.id, createdBy: user.id });
    }
    refresh();
    const label = v.kind === "income" ? "Pemasukan" : v.kind === "expense" ? "Pengeluaran" : "Transfer";
    return { ok: true, message: id ? "Perubahan disimpan." : `${label} tercatat.` };
  });
}

export async function deleteTransaction(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const res = await db
      .delete(schema.transactions)
      .where(and(eq(schema.transactions.id, parseId(form.get("id"))), eq(schema.transactions.bookId, book.id)))
      .returning({ id: schema.transactions.id });
    if (!res.length) throw new ActionError("Transaksi tidak ditemukan.");
    refresh();
    return { ok: true, message: "Transaksi dihapus." };
  });
}

/* ───────── Dompet ───────── */

export async function saveWallet(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const parsed = walletSchema.safeParse(formObject(form));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const id = form.get("id");
    if (id) {
      const res = await db
        .update(schema.wallets)
        .set(parsed.data)
        .where(and(eq(schema.wallets.id, parseId(id)), eq(schema.wallets.bookId, book.id)))
        .returning({ id: schema.wallets.id });
      if (!res.length) throw new ActionError("Dompet tidak ditemukan.");
    } else {
      const ent = await getBookEntitlement(book.ownerId);
      const max = ent.features.maxWallets;
      if (max !== null) {
        const [c] = await db.select({ c: sql<string>`count(*)` }).from(schema.wallets).where(and(eq(schema.wallets.bookId, book.id), eq(schema.wallets.archived, false)));
        if (Number(c.c) >= max) throw new ActionError(`Paket ${ent.planName} maksimal ${max} dompet aktif. Upgrade ke Premium untuk dompet tanpa batas.`);
      }
      await db.insert(schema.wallets).values({ ...parsed.data, bookId: book.id });
    }
    refresh();
    return { ok: true, message: id ? "Dompet diperbarui." : "Dompet ditambahkan." };
  });
}

export async function setWalletArchived(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const archived = form.get("archived") === "1";
    const id = parseId(form.get("id"));
    if (!archived) {
      const ent = await getBookEntitlement(book.ownerId);
      const max = ent.features.maxWallets;
      if (max !== null) {
        const [c] = await db.select({ c: sql<string>`count(*)` }).from(schema.wallets).where(and(eq(schema.wallets.bookId, book.id), eq(schema.wallets.archived, false)));
        if (Number(c.c) >= max) throw new ActionError(`Paket ${ent.planName} maksimal ${max} dompet aktif.`);
      }
    } else {
      const [c] = await db.select({ c: sql<string>`count(*)` }).from(schema.wallets).where(and(eq(schema.wallets.bookId, book.id), eq(schema.wallets.archived, false)));
      if (Number(c.c) <= 1) throw new ActionError("Minimal harus ada satu dompet aktif.");
    }
    const res = await db.update(schema.wallets).set({ archived }).where(and(eq(schema.wallets.id, id), eq(schema.wallets.bookId, book.id))).returning({ id: schema.wallets.id });
    if (!res.length) throw new ActionError("Dompet tidak ditemukan.");
    refresh();
    return { ok: true, message: archived ? "Dompet diarsipkan. Riwayatnya tetap aman." : "Dompet diaktifkan lagi." };
  });
}

/* ───────── Kategori ───────── */

export async function saveCategory(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const parsed = categorySchema.safeParse(formObject(form));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const id = form.get("id");
    if (id) {
      const { kind: _kind, ...rest } = parsed.data; // jenis kategori tidak bisa diubah
      void _kind;
      const res = await db.update(schema.categories).set(rest).where(and(eq(schema.categories.id, parseId(id)), eq(schema.categories.bookId, book.id))).returning({ id: schema.categories.id });
      if (!res.length) throw new ActionError("Kategori tidak ditemukan.");
    } else {
      const ent = await getBookEntitlement(book.ownerId);
      const max = ent.features.maxCategories;
      if (max !== null) {
        const [c] = await db.select({ c: sql<string>`count(*)` }).from(schema.categories).where(and(eq(schema.categories.bookId, book.id), eq(schema.categories.archived, false)));
        if (Number(c.c) >= max) throw new ActionError(`Paket ${ent.planName} maksimal ${max} kategori aktif. Arsipkan yang jarang dipakai atau upgrade ke Premium.`);
      }
      await db.insert(schema.categories).values({ ...parsed.data, bookId: book.id });
    }
    refresh();
    return { ok: true, message: id ? "Kategori diperbarui." : "Kategori ditambahkan." };
  });
}

export async function setCategoryArchived(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const archived = form.get("archived") === "1";
    const res = await db
      .update(schema.categories)
      .set({ archived })
      .where(and(eq(schema.categories.id, parseId(form.get("id"))), eq(schema.categories.bookId, book.id)))
      .returning({ id: schema.categories.id });
    if (!res.length) throw new ActionError("Kategori tidak ditemukan.");
    refresh();
    return { ok: true, message: archived ? "Kategori disembunyikan." : "Kategori ditampilkan lagi." };
  });
}

/* ───────── Anggaran ───────── */

export async function saveBudget(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const parsed = budgetSchema.safeParse(formObject(form));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    await assertCategory(book.id, v.categoryId, "expense");
    await db
      .insert(schema.budgets)
      .values({ bookId: book.id, categoryId: v.categoryId, month: `${v.month}-01`, amount: v.amount })
      .onConflictDoUpdate({ target: [schema.budgets.bookId, schema.budgets.categoryId, schema.budgets.month], set: { amount: v.amount } });
    refresh();
    return { ok: true, message: "Anggaran disimpan." };
  });
}

export async function deleteBudget(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    await db.delete(schema.budgets).where(and(eq(schema.budgets.id, parseId(form.get("id"))), eq(schema.budgets.bookId, book.id)));
    refresh();
    return { ok: true, message: "Anggaran dihapus." };
  });
}

/** Salin semua anggaran bulan lalu ke bulan ini (yang sudah ada tidak ditimpa) */
export async function copyBudgets(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const month = z.string().regex(/^\d{4}-\d{2}$/).safeParse(form.get("month"));
    if (!month.success) throw new ActionError("Bulan tidak valid.");
    const target = `${month.data}-01`;
    const prev = addMonthsISO(target, -1);
    const rows = await db.select().from(schema.budgets).where(and(eq(schema.budgets.bookId, book.id), eq(schema.budgets.month, prev)));
    if (!rows.length) throw new ActionError("Bulan lalu belum punya anggaran untuk disalin.");
    await db
      .insert(schema.budgets)
      .values(rows.map((r) => ({ bookId: book.id, categoryId: r.categoryId, month: target, amount: r.amount })))
      .onConflictDoNothing();
    refresh();
    return { ok: true, message: `${rows.length} anggaran disalin dari bulan lalu.` };
  });
}

/* ───────── Target tabungan ───────── */

export async function saveGoal(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const parsed = goalSchema.safeParse(formObject(form));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = { ...parsed.data, deadline: parsed.data.deadline ?? null };
    const id = form.get("id");
    if (id) {
      const res = await db.update(schema.goals).set(v).where(and(eq(schema.goals.id, parseId(id)), eq(schema.goals.bookId, book.id))).returning({ id: schema.goals.id });
      if (!res.length) throw new ActionError("Target tidak ditemukan.");
    } else {
      const ent = await getBookEntitlement(book.ownerId);
      const max = ent.features.maxGoals;
      if (max !== null) {
        const [c] = await db.select({ c: sql<string>`count(*)` }).from(schema.goals).where(and(eq(schema.goals.bookId, book.id), eq(schema.goals.archived, false)));
        if (Number(c.c) >= max) throw new ActionError(`Paket ${ent.planName} maksimal ${max} target aktif. Upgrade ke Premium untuk target tanpa batas.`);
      }
      await db.insert(schema.goals).values({ ...v, bookId: book.id });
    }
    refresh();
    return { ok: true, message: id ? "Target diperbarui." : "Target dibuat. Semangat menabung!" };
  });
}

export async function addGoalEntry(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book, user } = await bookAction();
    const parsed = goalEntrySchema.safeParse(formObject(form));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    const goal = await db.query.goals.findFirst({ where: and(eq(schema.goals.id, v.goalId), eq(schema.goals.bookId, book.id)) });
    if (!goal) throw new ActionError("Target tidak ditemukan.");
    if (v.direction === "out") {
      const [s] = await db.select({ s: sql<string>`coalesce(sum(amount),0)` }).from(schema.goalEntries).where(eq(schema.goalEntries.goalId, goal.id));
      if (v.amount > Number(s.s)) throw new ActionError("Nominal penarikan melebihi saldo tabungan target ini.");
    }
    await db.insert(schema.goalEntries).values({ goalId: goal.id, amount: v.direction === "in" ? v.amount : -v.amount, note: v.note || null, occurredOn: v.occurredOn, createdBy: user.id });
    refresh();
    return { ok: true, message: v.direction === "in" ? "Setoran tercatat." : "Penarikan tercatat." };
  });
}

export async function setGoalArchived(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const archived = form.get("archived") === "1";
    const res = await db.update(schema.goals).set({ archived }).where(and(eq(schema.goals.id, parseId(form.get("id"))), eq(schema.goals.bookId, book.id))).returning({ id: schema.goals.id });
    if (!res.length) throw new ActionError("Target tidak ditemukan.");
    refresh();
    return { ok: true, message: archived ? "Target diarsipkan." : "Target diaktifkan lagi." };
  });
}

export async function deleteGoal(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    const res = await db.delete(schema.goals).where(and(eq(schema.goals.id, parseId(form.get("id"))), eq(schema.goals.bookId, book.id))).returning({ id: schema.goals.id });
    if (!res.length) throw new ActionError("Target tidak ditemukan.");
    refresh();
    return { ok: true, message: "Target dihapus." };
  });
}

/* ───────── Tagihan rutin (Premium) ───────── */

async function requireBillsFeature(ownerId: string) {
  const ent = await getBookEntitlement(ownerId);
  if (!ent.features.bills) throw new ActionError("Pengingat tagihan adalah fitur Premium.");
}

export async function saveBill(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    await requireBillsFeature(book.ownerId);
    const parsed = billSchema.safeParse(formObject(form));
    if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
    const v = parsed.data;
    await assertCategory(book.id, v.categoryId, "expense");
    await assertWallets(book.id, [v.walletId]);
    const values = { ...v, categoryId: v.categoryId ?? null, walletId: v.walletId ?? null };
    const id = form.get("id");
    if (id) {
      const res = await db.update(schema.bills).set(values).where(and(eq(schema.bills.id, parseId(id)), eq(schema.bills.bookId, book.id))).returning({ id: schema.bills.id });
      if (!res.length) throw new ActionError("Tagihan tidak ditemukan.");
    } else await db.insert(schema.bills).values({ ...values, bookId: book.id });
    refresh();
    return { ok: true, message: id ? "Tagihan diperbarui." : "Tagihan ditambahkan. Boma akan mengingatkan." };
  });
}

export async function deleteBill(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book } = await bookAction();
    await db.delete(schema.bills).where(and(eq(schema.bills.id, parseId(form.get("id"))), eq(schema.bills.bookId, book.id)));
    refresh();
    return { ok: true, message: "Tagihan dihapus." };
  });
}

function advance(due: string, f: "weekly" | "monthly" | "yearly") {
  return f === "weekly" ? addDaysISO(due, 7) : f === "monthly" ? addMonthsISO(due, 1) : addMonthsISO(due, 12);
}

/** Tandai lunas: catat pengeluaran (jika dompet ada) lalu majukan jatuh tempo */
export async function payBill(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async () => {
    const { book, user } = await bookAction();
    await requireBillsFeature(book.ownerId);
    const id = parseId(form.get("id"));
    const record = form.get("record") !== "0";
    return db.transaction(async (tx) => {
      // kunci baris supaya klik ganda tidak mencatat dua kali
      const [bill] = await tx.select().from(schema.bills).where(and(eq(schema.bills.id, id), eq(schema.bills.bookId, book.id))).for("update");
      if (!bill) throw new ActionError("Tagihan tidak ditemukan.");
      if (record) {
        if (!bill.walletId) throw new ActionError("Atur dompet pembayaran di tagihan ini dulu, atau tandai lunas tanpa mencatat.");
        await tx.insert(schema.transactions).values({
          bookId: book.id,
          kind: "expense",
          amount: bill.amount,
          walletId: bill.walletId,
          categoryId: bill.categoryId,
          occurredOn: todayISO(),
          note: `Bayar ${bill.name}`,
          createdBy: user.id,
        });
      }
      await tx.update(schema.bills).set({ nextDueOn: advance(bill.nextDueOn, bill.frequency) }).where(eq(schema.bills.id, bill.id));
      refresh();
      return { ok: true, message: record ? `${bill.name} lunas & tercatat sebagai pengeluaran.` : `${bill.name} ditandai lunas.` };
    });
  });
}
