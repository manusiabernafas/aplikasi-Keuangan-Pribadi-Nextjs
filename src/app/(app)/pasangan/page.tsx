import type { Metadata } from "next";
import { and, eq, gt } from "drizzle-orm";
import { LogOut, UserMinus, X } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { PremiumGate } from "@/components/app/premium-gate";
import { ActionButton } from "@/components/app/confirm-form";
import { Avatar } from "@/components/app/user-menu";
import { BomaCat } from "@/components/illustrations/boma-cat";
import { HomeHeartArt } from "@/components/illustrations/scenes";
import { Card, CardTitle } from "@/components/ui/card";
import { removeMember, revokeInvite } from "@/lib/actions/account";
import { requireBook } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { dateLabel } from "@/lib/dates";
import { getBookEntitlement } from "@/lib/server/plans";
import { getMembers } from "@/lib/server/queries";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Pasangan" };

export default async function PasanganPage() {
  const { user, book, role } = await requireBook();
  const ent = await getBookEntitlement(book.ownerId);
  const members = await getMembers(book.id);

  if (role === "partner")
    return (
      <div>
        <PageHeader title="Pasangan" text={`Kamu mengelola "${book.name}" bersama pemiliknya.`} />
        <Card className="max-w-xl">
          <CardTitle>Anggota buku</CardTitle>
          <MemberList members={members} />
          <div className="mt-5 border-t border-line pt-4">
            <ActionButton action={removeMember} fields={{ userId: user.id }} variant="danger-soft" confirm="Keluar dari buku keuangan bersama ini? Kamu kembali ke buku pribadimu." pendingText="Keluar…">
              <LogOut className="size-4" /> Keluar dari buku ini
            </ActionButton>
          </div>
        </Card>
      </div>
    );

  if (!ent.features.partner)
    return (
      <div>
        <PageHeader title="Pasangan" text="Kelola keuangan rumah tangga berdua." />
        <PremiumGate
          isOwner
          title="Ajak pasangan mengelola uang bersama"
          text="Satu buku keuangan untuk berdua: catat bersama, lihat anggaran rumah tangga, dan menabung untuk target yang sama."
          art={<div className="flex items-end"><BomaCat pose="happy" className="w-28" title="" /><HomeHeartArt className="mb-2 w-16" /><BomaCat pose="sit" variant="mochi" className="w-24" title="" /></div>}
          points={["Undang 1 pasangan lewat email Google", "Setiap transaksi tercatat siapa yang input", "Hak akses bisa dicabut kapan saja"]}
        />
      </div>
    );

  const invites = await db
    .select({ id: schema.invitations.id, email: schema.invitations.email, expiresAt: schema.invitations.expiresAt })
    .from(schema.invitations)
    .where(and(eq(schema.invitations.bookId, book.id), eq(schema.invitations.status, "pending"), gt(schema.invitations.expiresAt, new Date())));
  const hasPartner = members.some((m) => m.role === "partner");

  return (
    <div>
      <PageHeader title="Pasangan" text={`Kelola "${book.name}" berdua dengan orang yang kamu percaya.`} pose="happy" />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardTitle>Anggota buku</CardTitle>
            <MemberList members={members} canRemove={(id) => id !== user.id} />
          </Card>
          {!hasPartner && (
            <Card>
              <CardTitle>Undang pasangan</CardTitle>
              <InviteForm />
              {invites.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-line pt-4">
                  {invites.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-ink">{i.email}</span>
                        <span className="text-xs text-muted">Menunggu · berlaku sampai {dateLabel(i.expiresAt.toISOString().slice(0, 10))}</span>
                      </span>
                      <ActionButton action={revokeInvite} fields={{ id: i.id }} pendingText="">
                        <X className="size-4" /> Batalkan
                      </ActionButton>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
        <Card className="bg-latte-2">
          <div className="flex items-end justify-center">
            <BomaCat pose="happy" className="w-32" title="" />
            <HomeHeartArt className="mb-2 w-20" />
            <BomaCat pose="sit" variant="mochi" className="w-28" title="" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-ink">Cara kerjanya</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
            <li>Masukkan email Google pasanganmu, lalu kirim tautannya.</li>
            <li>Pasanganmu membuka tautan dan masuk dengan Google.</li>
            <li>Kalian berdua bisa mencatat di buku ini. Buku pribadi pasanganmu tetap terpisah.</li>
            <li>Akses pasangan mengikuti paket Premium-mu dan bisa dicabut kapan saja.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}

function MemberList({ members, canRemove }: { members: Awaited<ReturnType<typeof getMembers>>; canRemove?: (id: string) => boolean }) {
  return (
    <ul className="space-y-3">
      {members.map((m) => (
        <li key={m.userId} className="flex items-center gap-3">
          <Avatar name={m.name} image={m.image} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">{m.name}</span>
            <span className="block truncate text-xs text-muted">{m.email}</span>
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${m.role === "owner" ? "bg-mocha-soft text-mocha" : "bg-nose-soft text-[#b4504a]"}`}>{m.role === "owner" ? "Pemilik" : "Pasangan"}</span>
          {m.role === "partner" && canRemove?.(m.userId) && (
            <ActionButton action={removeMember} fields={{ userId: m.userId }} confirm={`Keluarkan ${m.name} dari buku ini? Datanya tidak dihapus.`} pendingText="" className="size-9 px-0">
              <UserMinus className="size-4" aria-label="Keluarkan" />
            </ActionButton>
          )}
        </li>
      ))}
    </ul>
  );
}
