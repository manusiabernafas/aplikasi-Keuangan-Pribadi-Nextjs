"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, ShieldUser, type LucideIcon } from "lucide-react";
import { NAV, NAV_BOTTOM } from "./nav-items";
import { cn } from "@/lib/utils";

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(href + "/");
}

export function SideNav({ isAdmin, premium }: { isAdmin: boolean; premium: boolean }) {
  const active = useActive();
  const item = (n: { href: string; label: string; icon: LucideIcon; premium?: boolean }) => (
    <Link
      key={n.href}
      href={n.href}
      aria-current={active(n.href) ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors",
        active(n.href) ? "bg-mocha text-white" : "text-muted hover:bg-latte-2 hover:text-ink",
      )}
    >
      <n.icon className="size-5" />
      <span className="flex-1">{n.label}</span>
      {n.premium && !premium && <Crown className={cn("size-3.5", active(n.href) ? "text-white/80" : "text-caramel")} aria-label="Premium" />}
    </Link>
  );
  return (
    <nav aria-label="Menu aplikasi" className="space-y-1">
      {NAV.map(item)}
      <div className="my-3 border-t border-line" />
      {NAV_BOTTOM.map(item)}
      {isAdmin && item({ href: "/admin", label: "Panel admin", icon: ShieldUser })}
    </nav>
  );
}

const MOBILE = [NAV[0], NAV[1], null, NAV[3], NAV[5]];

export function BottomNav({ fab }: { fab: React.ReactNode }) {
  const active = useActive();
  return (
    <nav aria-label="Menu bawah" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
        {MOBILE.map((n, i) =>
          n ? (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold", active(n.href) ? "text-mocha" : "text-muted")}>
              <n.icon className="size-5.5" strokeWidth={active(n.href) ? 2.5 : 2} />
              {n.label}
            </Link>
          ) : (
            <div key={i} className="-mt-6 flex justify-center pb-2">
              {fab}
            </div>
          ),
        )}
      </div>
    </nav>
  );
}
