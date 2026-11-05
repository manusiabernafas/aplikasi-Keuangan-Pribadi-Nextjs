import type { Metadata } from "next";
import { createHash } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { Logo } from "@/components/brand/logo";
import { BomaCat } from "@/components/illustrations/boma-cat";
import { HomeHeartArt } from "@/components/illustrations/scenes";
import { ButtonLink } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { AcceptForm } from "./accept-form";

export const metadata: Metadata = { title: "Undangan", robots: { index: false } };

export default async function UndanganPage({ params }: PageProps<"/undangan/[token]">) {
  const { token } = await params;
  const valid = /^[\w-]{20,80}$/.test(token);
  const inv = valid
    ? (
        await db
          .select({ email: schema.invitations.email, bookName: schema.books.name, inviter: schema.users.name })
          .from(schema.invitations)
          .innerJoin(schema.books, eq(schema.books.id, schema.invitations.bookId))
          .innerJoin(schema.users, eq(schema.users.id, schema.invitations.invitedBy))
          .where(and(eq(schema.invitations.tokenHash, createHash("sha256").update(token).digest("hex")), eq(schema.invitations.status, "pending"), gt(schema.invitations.expiresAt, new Date())))
          .limit(1)
      )[0]
    : undefined;
  const user = await getSessionUser();

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 py-8">
      <Logo />
      <div className="mt-10 w-full max-w-md rounded-[32px] border border-line bg-card p-6 text-center sm:p-8">
        {inv ? (
          <>
            <div className="flex items-end justify-center">
              <BomaCat pose="wave" className="w-28" title="" />
              <HomeHeartArt className="mb-2 w-16" />
              <BomaCat pose="sit" variant="mochi" className="w-24" title="" />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold text-ink">{inv.inviter.split(" ")[0]} mengajakmu mengelola uang bersama</h1>
            <p className="mt-2 text-muted">
              Kamu diundang ke buku keuangan <b className="text-ink">{inv.bookName}</b>. Undangan ini untuk <b className="text-ink">{inv.email}</b>.
            </p>
            <div className="mt-6">
              {user ? (
                <>
                  <p className="mb-3 text-sm text-muted">Masuk sebagai {user.email}</p>
                  <AcceptForm token={token} />
                </>
              ) : (
                <ButtonLink href={`/masuk?next=${encodeURIComponent(`/undangan/${token}`)}`} className="w-full" size="lg">
                  Masuk dengan Google untuk menerima
                </ButtonLink>
              )}
            </div>
          </>
        ) : (
          <>
            <BomaCat pose="think" className="mx-auto w-32" title="" />
            <h1 className="mt-4 text-2xl font-extrabold text-ink">Undangan tidak berlaku</h1>
            <p className="mt-2 text-muted">Tautan ini sudah dipakai, dibatalkan, atau kedaluwarsa. Minta pasanganmu membuat undangan baru.</p>
            <ButtonLink href="/" variant="secondary" className="mt-6">Ke beranda</ButtonLink>
          </>
        )}
      </div>
    </div>
  );
}
