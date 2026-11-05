import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BomaCat } from "@/components/illustrations/boma-cat";
import { getSessionUser } from "@/lib/auth/session";
import { devPasswordLogin, googleEnabled } from "@/lib/env.server";
import { GoogleButton } from "./google-button";
import { DevLogin } from "./dev-login";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

const ERRORS: Record<string, string> = {
  google: "Login Google dibatalkan atau gagal. Silakan coba lagi.",
  diblokir: "Akun ini sedang dinonaktifkan. Hubungi kami bila menurutmu ini keliru.",
};

/** Hanya izinkan tujuan internal (cegah open redirect) */
function safeNext(v: string | string[] | undefined) {
  const s = typeof v === "string" ? v : "";
  return /^\/(?!\/)[\w\-/?=&%.]*$/.test(s) ? s : "/dasbor";
}

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const sp = await searchParams;
  const next = sp.lanjut === "premium" ? "/langganan" : safeNext(sp.next);
  if (await getSessionUser()) redirect(next);
  const err = typeof sp.galat === "string" ? ERRORS[sp.galat] : undefined;
  const google = googleEnabled();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <BomaCat pose="wave" animated className="w-32 lg:hidden" title="Boma" />
          <h1 className="mt-4 text-3xl font-extrabold text-ink">Halo! Senang kamu datang.</h1>
          <p className="mt-2 text-muted">Masuk atau daftar cukup dengan akun Google. Tidak perlu membuat kata sandi baru.</p>
          {err && (
            <p role="alert" className="mt-5 rounded-2xl bg-expense-soft px-4 py-3 text-sm font-semibold text-expense">
              {err}
            </p>
          )}
          <div className="mt-8">
            <GoogleButton next={next} disabled={!google} />
            {!google && <p className="mt-3 text-sm text-muted">Login Google belum dikonfigurasi di server ini.</p>}
          </div>
          {devPasswordLogin() && (
            <div className="mt-6">
              <DevLogin />
            </div>
          )}
          <p className="mt-8 flex items-start gap-2 text-sm text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-income" />
            Boma hanya membaca nama, email, dan foto profil Google kamu. Dengan masuk, kamu setuju dengan{" "}
            <Link href="/syarat" className="font-semibold text-mocha underline">syarat layanan</Link> dan{" "}
            <Link href="/privasi" className="font-semibold text-mocha underline">kebijakan privasi</Link>.
          </p>
        </div>
      </div>
      <div className="hidden flex-col items-center justify-center bg-latte-2 p-10 lg:flex">
        <BomaCat pose="wave" animated className="boma-float w-80" title="Boma melambaikan tangan" />
        <p className="mt-6 max-w-sm text-center font-display text-2xl font-bold text-ink">“Yuk catat pelan-pelan. Aku bantu ingat semuanya.”</p>
        <p className="mt-2 text-muted">— Boma</p>
      </div>
    </div>
  );
}
