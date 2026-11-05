import "server-only";
import { db, schema } from "@/lib/db";

export async function audit(actorId: string | null, action: string, target?: string, meta?: Record<string, unknown>) {
  try {
    await db.insert(schema.auditLogs).values({ actorId, action, target, meta });
  } catch {
    // Audit tidak boleh menggagalkan aksi utama.
  }
}
