import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "@/lib/actions/account";

export function Avatar({ name, image, className = "size-10" }: { name: string; image: string | null; className?: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" referrerPolicy="no-referrer" className={`${className} shrink-0 rounded-full border-2 border-card object-cover`} />
  ) : (
    <span className={`${className} grid shrink-0 place-items-center rounded-full bg-caramel-soft font-display text-sm font-bold text-mocha`} aria-hidden>
      {initials}
    </span>
  );
}

export function UserMenu({ name, email, image }: { name: string; email: string; image: string | null }) {
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl p-1 hover:bg-latte-2 [&::-webkit-details-marker]:hidden" aria-label="Menu akun">
        <Avatar name={name} image={image} />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-line bg-card p-2 shadow-lg">
        <div className="px-3 py-2">
          <p className="truncate font-bold text-ink">{name}</p>
          <p className="truncate text-sm text-muted">{email}</p>
        </div>
        <div className="my-1 border-t border-line" />
        <Link href="/pengaturan" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-latte-2">
          <Settings className="size-4" /> Pengaturan
        </Link>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-expense hover:bg-expense-soft">
            <LogOut className="size-4" /> Keluar
          </button>
        </form>
      </div>
    </details>
  );
}
