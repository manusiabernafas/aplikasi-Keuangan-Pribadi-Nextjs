import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { TZ } from "@/lib/dates";

export const metadata: Metadata = { title: "Log · Admin" };
const fmt = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function AdminLog() {
  await requireSuperAdmin();
  const rows = await db
    .select({ l: schema.auditLogs, email: schema.users.email })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(200);
  return (
    <Card className="p-0">
      <ul className="divide-y divide-line">
        {rows.map(({ l, email }) => (
          <li key={l.id} className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-sm">
            <span className="w-32 shrink-0 text-muted">{fmt(l.createdAt)}</span>
            <span className="font-mono text-xs font-bold text-mocha">{l.action}</span>
            <span className="min-w-0 flex-1 truncate text-ink">{email ?? "sistem"}{l.meta ? <span className="text-muted"> · {JSON.stringify(l.meta).slice(0, 140)}</span> : null}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="px-4 py-8 text-center text-muted">Belum ada aktivitas.</li>}
      </ul>
    </Card>
  );
}
