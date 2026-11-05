import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const DEFAULT_CATEGORIES: { kind: "income" | "expense"; name: string; icon: string; color: string }[] = [
  { kind: "expense", name: "Makan & minum", icon: "utensils", color: "caramel" },
  { kind: "expense", name: "Transportasi", icon: "bus", color: "sky" },
  { kind: "expense", name: "Belanja", icon: "shopping-bag", color: "nose" },
  { kind: "expense", name: "Tagihan & utilitas", icon: "receipt", color: "mocha" },
  { kind: "expense", name: "Rumah", icon: "home", color: "latte" },
  { kind: "expense", name: "Kesehatan", icon: "heart-pulse", color: "expense" },
  { kind: "expense", name: "Hiburan", icon: "popcorn", color: "nose" },
  { kind: "expense", name: "Pendidikan", icon: "graduation-cap", color: "sky" },
  { kind: "expense", name: "Sedekah & hadiah", icon: "gift", color: "income" },
  { kind: "expense", name: "Lainnya", icon: "circle", color: "latte" },
  { kind: "income", name: "Gaji", icon: "briefcase", color: "income" },
  { kind: "income", name: "Bonus", icon: "sparkles", color: "caramel" },
  { kind: "income", name: "Usaha", icon: "store", color: "mocha" },
  { kind: "income", name: "Investasi", icon: "trending-up", color: "sky" },
  { kind: "income", name: "Lainnya", icon: "circle", color: "latte" },
];

/** Dipanggil sekali saat akun dibuat: buku pribadi + dompet Tunai + kategori bawaan. */
export async function ensurePersonalBook(userId: string, name: string) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.bookMembers.findFirst({ where: (t, { eq, and }) => and(eq(t.userId, userId), eq(t.role, "owner")) });
    if (existing) return existing.bookId;
    const first = name.trim().split(/\s+/)[0]?.slice(0, 40) || "Saya";
    const [book] = await tx.insert(schema.books).values({ ownerId: userId, name: `Keuangan ${first}` }).returning({ id: schema.books.id });
    await tx.insert(schema.bookMembers).values({ bookId: book.id, userId, role: "owner" });
    await tx.insert(schema.wallets).values({ bookId: book.id, name: "Tunai", type: "cash", color: "caramel" });
    await tx.insert(schema.categories).values(DEFAULT_CATEGORIES.map((c) => ({ ...c, bookId: book.id })));
    await tx.update(schema.users).set({ activeBookId: book.id }).where(eq(schema.users.id, userId));
    return book.id;
  });
}
