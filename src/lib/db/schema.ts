import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * Semua nominal uang disimpan sebagai bigint rupiah utuh (tanpa desimal) supaya
 * tidak ada galat pembulatan float. Semua id uuid agar tidak bisa ditebak.
 */
const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" });

/* ───────────── Auth (Better Auth) ───────────── */

export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["user", "super_admin"] }).notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  activeBookId: uuid("active_book_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: id(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = pgTable("verifications", {
  id: id(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ───────────── Buku keuangan & pasangan ───────────── */

/** Satu buku = satu ruang keuangan. Pemilik bisa mengundang pasangan ke bukunya. */
export const books = pgTable("books", {
  id: id(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: createdAt(),
});

export const bookMembers = pgTable(
  "book_members",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "partner"] }).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bookId, t.userId] }), index("book_members_user_idx").on(t.userId)],
);

export const invitations = pgTable(
  "invitations",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    /** sha256 dari token; token mentah hanya ada di tautan undangan */
    tokenHash: text("token_hash").notNull().unique(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["pending", "accepted", "revoked"] }).notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("invitations_book_idx").on(t.bookId)],
);

/* ───────────── Data keuangan ───────────── */

export const wallets = pgTable(
  "wallets",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: ["cash", "bank", "ewallet", "other"] }).notNull().default("cash"),
    color: text("color").notNull().default("mocha"),
    initialBalance: money("initial_balance").notNull().default(0),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("wallets_book_idx").on(t.bookId)],
);

export const categories = pgTable(
  "categories",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["income", "expense"] }).notNull(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("circle"),
    color: text("color").notNull().default("caramel"),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("categories_book_idx").on(t.bookId, t.kind)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["income", "expense", "transfer"] }).notNull(),
    amount: money("amount").notNull(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    toWalletId: uuid("to_wallet_id").references(() => wallets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    note: text("note"),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("transactions_book_date_idx").on(t.bookId, t.occurredOn),
    index("transactions_wallet_idx").on(t.walletId),
    index("transactions_to_wallet_idx").on(t.toWalletId),
    check("transactions_amount_positive", sql`${t.amount} > 0`),
    check(
      "transactions_transfer_shape",
      sql`(${t.kind} = 'transfer' and ${t.toWalletId} is not null and ${t.toWalletId} <> ${t.walletId}) or (${t.kind} <> 'transfer' and ${t.toWalletId} is null)`,
    ),
  ],
);

/** Anggaran bulanan per kategori pengeluaran. month = tanggal 1 bulan tsb. */
export const budgets = pgTable(
  "budgets",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    month: date("month", { mode: "string" }).notNull(),
    amount: money("amount").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("budgets_book_cat_month_uq").on(t.bookId, t.categoryId, t.month), check("budgets_amount_positive", sql`${t.amount} > 0`)],
);

export const goals = pgTable(
  "goals",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: money("target_amount").notNull(),
    deadline: date("deadline", { mode: "string" }),
    icon: text("icon").notNull().default("target"),
    color: text("color").notNull().default("caramel"),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("goals_book_idx").on(t.bookId), check("goals_target_positive", sql`${t.targetAmount} > 0`)],
);

/** Setoran (+) atau penarikan (-) dari target tabungan */
export const goalEntries = pgTable(
  "goal_entries",
  {
    id: id(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    amount: money("amount").notNull(),
    note: text("note"),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("goal_entries_goal_idx").on(t.goalId), check("goal_entries_amount_nonzero", sql`${t.amount} <> 0`)],
);

/** Tagihan rutin: saat ditandai lunas, dibuat transaksi & jatuh tempo maju */
export const bills = pgTable(
  "bills",
  {
    id: id(),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: money("amount").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
    frequency: text("frequency", { enum: ["weekly", "monthly", "yearly"] }).notNull().default("monthly"),
    nextDueOn: date("next_due_on", { mode: "string" }).notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("bills_book_due_idx").on(t.bookId, t.nextDueOn), check("bills_amount_positive", sql`${t.amount} > 0`)],
);

/* ───────────── Langganan (SaaS) ───────────── */

/** Batas & hak fitur per paket. Diatur super admin dari panel. */
export type PlanFeatures = {
  maxWallets: number | null; // null = tanpa batas
  maxGoals: number | null;
  maxCategories: number | null;
  partner: boolean;
  bills: boolean;
  export: boolean;
  fullReports: boolean;
};

export const plans = pgTable("plans", {
  id: id(),
  code: text("code").notNull().unique(), // "free" | "premium"
  name: text("name").notNull(),
  description: text("description"),
  price: money("price").notNull().default(0),
  periodDays: integer("period_days").notNull().default(30),
  features: jsonb("features").$type<PlanFeatures>().notNull(),
  active: boolean("active").notNull().default(true),
  updatedAt: updatedAt(),
});

export const subscriptions = pgTable("subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const payments = pgTable(
  "payments",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    invoiceNumber: text("invoice_number").notNull().unique(),
    amount: money("amount").notNull(),
    periodDays: integer("period_days").notNull(),
    status: text("status", { enum: ["pending", "paid", "failed", "expired"] }).notNull().default("pending"),
    paymentUrl: text("payment_url"),
    paymentMethod: text("payment_method"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_user_idx").on(t.userId, t.createdAt), index("payments_status_idx").on(t.status, t.createdAt)],
);

/* ───────────── Audit ───────────── */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    target: text("target"),
    meta: jsonb("meta"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt), index("audit_logs_actor_idx").on(t.actorId)],
);
