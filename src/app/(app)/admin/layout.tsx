import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/session";

const TABS = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/pengguna", label: "Pengguna" },
  { href: "/admin/paket", label: "Paket & harga" },
  { href: "/admin/pembayaran", label: "Pembayaran" },
  { href: "/admin/log", label: "Log aktivitas" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireSuperAdmin();
  return (
    <div>
      <div className="mb-6">
        <p className="text-sm font-bold tracking-wide text-caramel uppercase">Super admin</p>
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Panel admin</h1>
        <nav aria-label="Menu admin" className="mt-4 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-card p-1">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-xl px-3.5 py-2 text-sm font-bold whitespace-nowrap text-muted hover:bg-latte-2 hover:text-ink">
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
