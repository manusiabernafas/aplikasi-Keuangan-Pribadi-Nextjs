import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET minimal 32 karakter"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  DEV_PASSWORD_LOGIN: z.string().optional().default(""),
  DOKU_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  DOKU_CLIENT_ID: z.string().optional().default(""),
  DOKU_SECRET_KEY: z.string().optional().default(""),
  CRON_SECRET: z.string().optional().default(""),
  /** Email (pisahkan koma) yang otomatis jadi super admin saat masuk */
  SUPER_ADMIN_EMAILS: z.string().optional().default(""),
});

export type ServerEnv = z.infer<typeof schema>;
let cached: ServerEnv | undefined;

/** Dibaca saat dipakai (bukan saat build) supaya `next build` tidak butuh rahasia. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  // Nilai kosong (mis. "DOKU_ENV=") dianggap tidak diisi agar default berlaku
  const parsed = schema.safeParse(Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== "")));
  if (!parsed.success) {
    throw new Error("Konfigurasi server tidak valid: " + parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  cached = parsed.data;
  return cached;
}

/**
 * Login email+sandi hanya untuk uji lokal. Aktif hanya bila DEV_PASSWORD_LOGIN=1 DAN
 * (bukan production ATAU APP_URL menunjuk localhost), jadi tidak pernah aktif di domain publik.
 */
export function devPasswordLogin() {
  const env = serverEnv();
  if (env.DEV_PASSWORD_LOGIN !== "1") return false;
  const host = new URL(env.APP_URL).hostname;
  return env.NODE_ENV !== "production" || host === "localhost" || host === "127.0.0.1";
}

export function googleEnabled() {
  const env = serverEnv();
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function isSuperAdminEmail(email: string) {
  const list = serverEnv().SUPER_ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}
