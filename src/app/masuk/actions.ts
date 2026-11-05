"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getAuth } from "@/lib/auth/auth";
import { devPasswordLogin } from "@/lib/env.server";

const schema = z.object({
  email: z.email("Format email belum benar").max(200),
  password: z.string().min(8, "Sandi minimal 8 karakter").max(128),
  name: z.string().trim().max(60).optional(),
});

/** Login uji lokal saja. Mati total di production (devPasswordLogin() = false). */
export async function devLogin(_: unknown, form: FormData) {
  if (!devPasswordLogin()) return { error: "Tidak tersedia." };
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password"), name: form.get("name") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, name } = parsed.data;
  const auth = getAuth();
  const h = await headers();
  try {
    await auth.api.signInEmail({ body: { email, password }, headers: h });
  } catch {
    try {
      await auth.api.signUpEmail({ body: { email, password, name: name || email.split("@")[0] }, headers: h });
    } catch {
      return { error: "Email atau sandi salah." };
    }
  }
  redirect("/dasbor");
}
