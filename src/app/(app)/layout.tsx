import Link from "next/link";
import { eq } from "drizzle-orm";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { Logo } from "@/components/brand/logo";
import { BomaCat } from "@/components/illustrations/boma-cat";
import { BottomNav, SideNav } from "@/components/app/nav";
import { NAV, NAV_BOTTOM } from "@/components/app/nav-items";
import { QuickAdd } from "@/components/app/quick-add";
import { UserMenu } from "@/components/app/user-menu";
import { BookSwitcher } from "@/components/app/book-switcher";
import { requireBook } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { getBookEntitlement } from "@/lib/server/plans";
import { getCategories, getWallets } from "@/lib/server/queries";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user, book } = await requireBook();
  const [wallets, categories, ent, books] = await Promise.all([
    getWallets(book.id),
    getCategories(book.id),
    getBookEntitlement(book.ownerId),
    db
      .select({ id: schema.books.id, name: schema.books.name, role: schema.bookMembers.role })
      .from(schema.bookMembers)
      .innerJoin(schema.books, eq(schema.books.id, schema.bookMembers.bookId))
      .where(eq(schema.bookMembers.userId, user.id)),
  ]);
  const w = wallets.map((x) => ({ id: x.id, name: x.name, balance: x.balance }));
  const c = categories.map((x) => ({ id: x.id, name: x.name, kind: x.kind, icon: x.icon, color: x.color }));
  const isAdmin = user.role === "super_admin";

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-5 overflow-y-auto border-r border-line bg-card px-4 py-5 lg:flex">
        <Logo href="/dasbor" className="px-2" />
        <BookSwitcher current={book} books={books} />
        <SideNav isAdmin={isAdmin} premium={ent.premium} />
        {!ent.premium && (
          <div className="relative mt-auto overflow-hidden rounded-3xl bg-caramel-soft p-4 pr-20">
            <p className="font-display font-bold text-ink">Buka semua fitur</p>
            <p className="mt-1 text-xs text-muted">Pasangan, tagihan, laporan lengkap.</p>
            <Link href="/langganan" className="mt-3 inline-flex rounded-xl bg-mocha px-3 py-2 text-xs font-bold text-white hover:bg-mocha-hover">
              Coba Premium
            </Link>
            <BomaCat pose="happy" className="absolute -right-4 -bottom-3 w-24" title="" />
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
            <details className="group relative lg:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-line bg-card [&::-webkit-details-marker]:hidden" aria-label="Buka menu">
                <Menu className="size-5" />
              </summary>
              <div className="absolute left-0 z-50 mt-2 w-64 space-y-1 rounded-2xl border border-line bg-card p-2 shadow-lg">
                <BookSwitcher current={book} books={books} />
                {[...NAV, ...NAV_BOTTOM, ...(isAdmin ? [{ href: "/admin", label: "Panel admin" }] : [])].map((n) => (
                  <Link key={n.href} href={n.href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-latte-2">
                    {n.label}
                  </Link>
                ))}
              </div>
            </details>
            <Logo href="/dasbor" className="lg:hidden" />
            <div className="flex-1" />
            <QuickAdd wallets={w} categories={c} className="hidden lg:inline-flex" />
            <UserMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <BottomNav fab={<QuickAdd wallets={w} categories={c} variant="fab" />} />
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-body)", borderRadius: "16px" } }} />
    </div>
  );
}
