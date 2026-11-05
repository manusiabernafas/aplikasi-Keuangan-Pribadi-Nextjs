import "server-only";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, schema } from "@/lib/db";
import { addDaysISO, addMonthsISO, monthEnd, monthStart } from "@/lib/dates";

/*
 * Semua fungsi di sini menerima bookId dari requireBook() dan SELALU memfilter
 * dengan bookId itu. Nilai dari pengguna masuk sebagai parameter (bukan string SQL).
 */
const t = schema.transactions;
const n = (v: unknown) => Number(v ?? 0);

export type WalletRow = { id: string; name: string; type: "cash" | "bank" | "ewallet" | "other"; color: string; archived: boolean; initialBalance: number; balance: number };

export async function getWallets(bookId: string, includeArchived = false): Promise<WalletRow[]> {
  const rows = await db
    .select({
      id: schema.wallets.id,
      name: schema.wallets.name,
      type: schema.wallets.type,
      color: schema.wallets.color,
      archived: schema.wallets.archived,
      initialBalance: schema.wallets.initialBalance,
      delta: sql<string>`coalesce((
        select sum(case
          when x.kind = 'income' and x.wallet_id = ${sql.raw('"wallets"."id"')} then x.amount
          when x.kind = 'expense' and x.wallet_id = ${sql.raw('"wallets"."id"')} then -x.amount
          when x.kind = 'transfer' and x.wallet_id = ${sql.raw('"wallets"."id"')} then -x.amount
          when x.kind = 'transfer' and x.to_wallet_id = ${sql.raw('"wallets"."id"')} then x.amount
          else 0 end)
        from transactions x
        where x.book_id = ${bookId} and (x.wallet_id = ${sql.raw('"wallets"."id"')} or x.to_wallet_id = ${sql.raw('"wallets"."id"')})
      ), 0)`,
    })
    .from(schema.wallets)
    .where(and(eq(schema.wallets.bookId, bookId), includeArchived ? undefined : eq(schema.wallets.archived, false)))
    .orderBy(asc(schema.wallets.createdAt));
  return rows.map((r) => ({ ...r, balance: r.initialBalance + n(r.delta) }));
}

export async function getCategories(bookId: string, includeArchived = false) {
  return db
    .select({ id: schema.categories.id, kind: schema.categories.kind, name: schema.categories.name, icon: schema.categories.icon, color: schema.categories.color, archived: schema.categories.archived })
    .from(schema.categories)
    .where(and(eq(schema.categories.bookId, bookId), includeArchived ? undefined : eq(schema.categories.archived, false)))
    .orderBy(asc(schema.categories.kind), asc(schema.categories.createdAt));
}
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];

export async function periodTotals(bookId: string, from: string, to: string) {
  const [r] = await db
    .select({
      income: sql<string>`coalesce(sum(${t.amount}) filter (where ${t.kind} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${t.amount}) filter (where ${t.kind} = 'expense'), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(t)
    .where(and(eq(t.bookId, bookId), gte(t.occurredOn, from), lte(t.occurredOn, to)));
  return { income: n(r?.income), expense: n(r?.expense), count: n(r?.count) };
}

/** Pengeluaran per hari pada rentang tanggal (hari tanpa transaksi = 0) */
export async function dailyExpense(bookId: string, from: string, to: string) {
  const rows = await db
    .select({ day: t.occurredOn, total: sql<string>`sum(${t.amount})` })
    .from(t)
    .where(and(eq(t.bookId, bookId), eq(t.kind, "expense"), gte(t.occurredOn, from), lte(t.occurredOn, to)))
    .groupBy(t.occurredOn);
  const map = new Map(rows.map((r) => [r.day, n(r.total)]));
  const out: { day: string; total: number }[] = [];
  for (let d = from; d <= to; d = addDaysISO(d, 1)) out.push({ day: d, total: map.get(d) ?? 0 });
  return out;
}

export async function byCategory(bookId: string, kind: "income" | "expense", from: string, to: string) {
  const c = schema.categories;
  const rows = await db
    .select({ id: c.id, name: c.name, icon: c.icon, color: c.color, total: sql<string>`sum(${t.amount})`, count: sql<string>`count(*)` })
    .from(t)
    .leftJoin(c, eq(c.id, t.categoryId))
    .where(and(eq(t.bookId, bookId), eq(t.kind, kind), gte(t.occurredOn, from), lte(t.occurredOn, to)))
    .groupBy(c.id, c.name, c.icon, c.color)
    .orderBy(desc(sql`sum(${t.amount})`));
  return rows.map((r) => ({ id: r.id, name: r.name ?? "Tanpa kategori", icon: r.icon ?? "circle", color: r.color ?? "latte", total: n(r.total), count: n(r.count) }));
}

/** Pemasukan & pengeluaran per bulan, `months` bulan terakhir sampai bulan `untilMonth` */
export async function monthlyTrend(bookId: string, untilISO: string, months = 6) {
  const end = monthEnd(untilISO);
  const start = addMonthsISO(monthStart(untilISO), -(months - 1));
  const rows = await db
    .select({
      m: sql<string>`to_char(${t.occurredOn}, 'YYYY-MM')`,
      income: sql<string>`coalesce(sum(${t.amount}) filter (where ${t.kind} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${t.amount}) filter (where ${t.kind} = 'expense'), 0)`,
    })
    .from(t)
    .where(and(eq(t.bookId, bookId), gte(t.occurredOn, start), lte(t.occurredOn, end)))
    .groupBy(sql`1`);
  const map = new Map(rows.map((r) => [r.m, r]));
  return Array.from({ length: months }, (_, i) => {
    const m = addMonthsISO(start, i).slice(0, 7);
    const r = map.get(m);
    return { month: `${m}-01`, income: n(r?.income), expense: n(r?.expense) };
  });
}

export type TxFilters = { from?: string; to?: string; kind?: "income" | "expense" | "transfer"; walletId?: string; categoryId?: string; q?: string };

export async function listTransactions(bookId: string, f: TxFilters, page = 1, perPage = 30) {
  const w = schema.wallets;
  const w2 = alias(schema.wallets, "w2");
  const c = schema.categories;
  const u = schema.users;
  const conds: (SQL | undefined)[] = [
    eq(t.bookId, bookId),
    f.from ? gte(t.occurredOn, f.from) : undefined,
    f.to ? lte(t.occurredOn, f.to) : undefined,
    f.kind ? eq(t.kind, f.kind) : undefined,
    f.walletId ? or(eq(t.walletId, f.walletId), eq(t.toWalletId, f.walletId)) : undefined,
    f.categoryId ? eq(t.categoryId, f.categoryId) : undefined,
    // escape wildcard agar input pengguna diperlakukan sebagai teks biasa
    f.q ? ilike(t.note, `%${f.q.replace(/[\\%_]/g, (m) => "\\" + m)}%`) : undefined,
  ];
  const where = and(...conds);
  const rows = await db
    .select({
      id: t.id,
      kind: t.kind,
      amount: t.amount,
      note: t.note,
      occurredOn: t.occurredOn,
      walletId: t.walletId,
      walletName: w.name,
      toWalletId: t.toWalletId,
      toWalletName: w2.name,
      categoryId: t.categoryId,
      categoryName: c.name,
      categoryIcon: c.icon,
      categoryColor: c.color,
      createdByName: u.name,
      createdBy: t.createdBy,
    })
    .from(t)
    .innerJoin(w, eq(w.id, t.walletId))
    .leftJoin(w2, eq(w2.id, t.toWalletId))
    .leftJoin(c, eq(c.id, t.categoryId))
    .leftJoin(u, eq(u.id, t.createdBy))
    .where(where)
    .orderBy(desc(t.occurredOn), desc(t.createdAt))
    .limit(perPage + 1)
    .offset((page - 1) * perPage);
  const [agg] = await db
    .select({
      income: sql<string>`coalesce(sum(${t.amount}) filter (where ${t.kind} = 'income'), 0)`,
      expense: sql<string>`coalesce(sum(${t.amount}) filter (where ${t.kind} = 'expense'), 0)`,
      count: sql<string>`count(*)`,
    })
    .from(t)
    .where(where);
  return { rows: rows.slice(0, perPage), hasMore: rows.length > perPage, totals: { income: n(agg?.income), expense: n(agg?.expense), count: n(agg?.count) } };
}
export type TxRow = Awaited<ReturnType<typeof listTransactions>>["rows"][number];

export async function getBudgets(bookId: string, month: string) {
  const b = schema.budgets;
  const c = schema.categories;
  const from = monthStart(month);
  const to = monthEnd(month);
  const rows = await db
    .select({
      id: b.id,
      amount: b.amount,
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      spent: sql<string>`coalesce((select sum(x.amount) from transactions x where x.book_id = ${bookId} and x.kind = 'expense' and x.category_id = ${sql.raw('"categories"."id"')} and x.occurred_on between ${from} and ${to}), 0)`,
    })
    .from(b)
    .innerJoin(c, eq(c.id, b.categoryId))
    .where(and(eq(b.bookId, bookId), eq(b.month, from)))
    .orderBy(asc(c.name));
  return rows.map((r) => ({ ...r, spent: n(r.spent) }));
}

export async function getGoals(bookId: string) {
  const g = schema.goals;
  const rows = await db
    .select({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      deadline: g.deadline,
      icon: g.icon,
      color: g.color,
      archived: g.archived,
      saved: sql<string>`coalesce((select sum(e.amount) from goal_entries e where e.goal_id = ${sql.raw('"goals"."id"')}), 0)`,
    })
    .from(g)
    .where(eq(g.bookId, bookId))
    .orderBy(asc(g.archived), asc(g.createdAt));
  return rows.map((r) => ({ ...r, saved: n(r.saved) }));
}
export type GoalRow = Awaited<ReturnType<typeof getGoals>>[number];

export async function getGoalEntries(bookId: string, goalId: string) {
  const e = schema.goalEntries;
  return db
    .select({ id: e.id, amount: e.amount, note: e.note, occurredOn: e.occurredOn, by: schema.users.name })
    .from(e)
    .innerJoin(schema.goals, eq(schema.goals.id, e.goalId))
    .leftJoin(schema.users, eq(schema.users.id, e.createdBy))
    .where(and(eq(e.goalId, goalId), eq(schema.goals.bookId, bookId)))
    .orderBy(desc(e.occurredOn), desc(e.createdAt))
    .limit(20);
}

export async function getBills(bookId: string, onlyActive = false) {
  const b = schema.bills;
  const c = schema.categories;
  return db
    .select({
      id: b.id,
      name: b.name,
      amount: b.amount,
      frequency: b.frequency,
      nextDueOn: b.nextDueOn,
      active: b.active,
      categoryId: b.categoryId,
      walletId: b.walletId,
      icon: c.icon,
      color: c.color,
      categoryName: c.name,
    })
    .from(b)
    .leftJoin(c, eq(c.id, b.categoryId))
    .where(and(eq(b.bookId, bookId), onlyActive ? eq(b.active, true) : undefined))
    .orderBy(asc(b.active), asc(b.nextDueOn));
}
export type BillRow = Awaited<ReturnType<typeof getBills>>[number];

export async function getMembers(bookId: string) {
  return db
    .select({ userId: schema.users.id, name: schema.users.name, email: schema.users.email, image: schema.users.image, role: schema.bookMembers.role, joinedAt: schema.bookMembers.joinedAt })
    .from(schema.bookMembers)
    .innerJoin(schema.users, eq(schema.users.id, schema.bookMembers.userId))
    .where(eq(schema.bookMembers.bookId, bookId))
    .orderBy(asc(schema.bookMembers.joinedAt));
}

export async function countTransactions(bookId: string) {
  const [r] = await db.select({ c: sql<string>`count(*)` }).from(t).where(eq(t.bookId, bookId));
  return n(r?.c);
}
