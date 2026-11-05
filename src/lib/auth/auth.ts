import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/lib/db";
import { devPasswordLogin, isSuperAdminEmail, serverEnv } from "@/lib/env.server";
import { eq } from "drizzle-orm";
import { ensurePersonalBook } from "@/lib/server/books";

function buildAuth() {
  const env = serverEnv();
  const google = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account" as const } } : {};

  return betterAuth({
    appName: "Boma",
    baseURL: env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.APP_URL],
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: { users: schema.users, sessions: schema.sessions, accounts: schema.accounts, verifications: schema.verifications },
    }),
    advanced: {
      database: { generateId: "uuid" },
      cookiePrefix: "boma",
      useSecureCookies: env.APP_URL.startsWith("https://"),
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"] },
    },
    // Masuk hanya lewat Google. Email+sandi hanya untuk uji lokal (lihat devPasswordLogin).
    emailAndPassword: { enabled: devPasswordLogin(), minPasswordLength: 8, maxPasswordLength: 128 },
    socialProviders: google,
    user: {
      additionalFields: {
        role: { type: "string", input: false, defaultValue: "user" },
        banned: { type: "boolean", input: false, defaultValue: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      // Sengaja mati: setiap request memeriksa sesi di Postgres, jadi logout & blokir akun langsung berlaku.
      cookieCache: { enabled: false },
    },
    databaseHooks: {
      user: { create: { after: async (user) => void (await ensurePersonalBook(user.id, user.name)) } },
      session: {
        create: {
          before: async (session) => {
            const u = await db.query.users.findFirst({ where: (t, { eq }) => eq(t.id, session.userId), columns: { banned: true, email: true, role: true, emailVerified: true } });
            if (u?.banned) return false;
            // Email terverifikasi Google yang terdaftar di SUPER_ADMIN_EMAILS dinaikkan jadi super admin
            if (u && u.role !== "super_admin" && u.emailVerified && isSuperAdminEmail(u.email)) {
              await db.update(schema.users).set({ role: "super_admin" }).where(eq(schema.users.id, session.userId));
            }
          },
        },
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/social": { window: 60, max: 10 },
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof buildAuth>;
let instance: Auth | undefined;

/** Dibuat saat pertama dipakai agar build tidak butuh koneksi database. */
export function getAuth(): Auth {
  instance ??= buildAuth();
  return instance;
}
