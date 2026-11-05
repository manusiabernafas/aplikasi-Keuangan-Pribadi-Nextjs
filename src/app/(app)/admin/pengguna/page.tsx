import type { Metadata } from "next";
import Link from "next/link";
import { desc, ilike, or, sql } from "drizzle-orm";
import { Search } from "lucide-react";
import { z } from "zod";
import { Avatar } from "@/components/app/user-menu";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { requireSuperAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { TZ } from "@/lib/dates";
import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Pengguna · Admin" };
const PER = 50;
const fmt = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(d);

export default async function AdminUsers({ searchParams }: PageProps<"/admin/pengguna">) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const q = z.string().trim().max(80).catch("").parse(sp.q ?? "");
  const page = z.coerce.number().int().min(1).max(1000).catch(1).parse(sp.hal ?? 1);
  const u = schema.users;
  const like = `%${q.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
  const rows = await db
    .select({
      id: u.id, name: u.name, email: u.email, image: u.image, role: u.role, banned: u.banned, createdAt: u.createdAt,
      premiumUntil: sql<Date | null>`(select s.current_period_end from subscriptions s where s.user_id = ${sql.raw('"users"."id"')} and s.current_period_end > now())`,
      txCount: sql<string>`(select count(*) from transactions t where t.created_by = ${sql.raw('"users"."id"')})`,
    })
    .from(u)
    .where(q ? or(ilike(u.email, like), ilike(u.name, like)) : undefined)
    .orderBy(desc(u.createdAt))
    .limit(PER + 1)
    .offset((page - 1) * PER);
  const more = rows.length > PER;

  return (
    <div>
      <form method="get" className="mb-4 flex gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <Input name="q" defaultValue={q} placeholder="Cari nama atau email…" className="pl-10" aria-label="Cari pengguna" />
        </div>
        <button className={buttonClass()}>Cari</button>
      </form>
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {rows.slice(0, PER).map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={r.name} image={r.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {r.name}
                  {r.role === "super_admin" && <span className="ml-2 rounded-full bg-mocha px-2 py-0.5 text-[10px] font-bold text-white">ADMIN</span>}
                  {r.banned && <span className="ml-2 rounded-full bg-expense-soft px-2 py-0.5 text-[10px] font-bold text-expense">DIBLOKIR</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {r.email} · daftar {fmt(r.createdAt)} · {Number(r.txCount)} transaksi
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.premiumUntil ? "bg-caramel-soft text-mocha" : "bg-latte-2 text-muted"}`}>
                {r.premiumUntil ? `Premium s/d ${fmt(new Date(r.premiumUntil))}` : "Gratis"}
              </span>
              <UserActions id={r.id} email={r.email} banned={r.banned} isAdmin={r.role === "super_admin"} />
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-8 text-center text-muted">Tidak ada pengguna yang cocok.</li>}
        </ul>
      </Card>
      <div className="mt-4 flex justify-between">
        {page > 1 ? <Link className={buttonClass({ variant: "secondary" })} href={`?q=${encodeURIComponent(q)}&hal=${page - 1}`}>Sebelumnya</Link> : <span />}
        {more && <Link className={buttonClass({ variant: "secondary" })} href={`?q=${encodeURIComponent(q)}&hal=${page + 1}`}>Berikutnya</Link>}
      </div>
    </div>
  );
}
