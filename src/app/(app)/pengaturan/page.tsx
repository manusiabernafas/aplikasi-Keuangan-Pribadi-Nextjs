import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Avatar } from "@/components/app/user-menu";
import { Card, CardTitle } from "@/components/ui/card";
import { signOut } from "@/lib/actions/account";
import { requireBook } from "@/lib/auth/session";
import { DeleteAccountForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanPage() {
  const { user, book, role } = await requireBook();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Pengaturan" text="Profil, buku keuangan, dan akun." pose="sit" />
      <div className="space-y-5">
        <Card>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={user.name} image={user.image} className="size-14" />
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{user.email}</p>
              <p className="text-sm text-muted">Masuk dengan Google{user.role === "super_admin" ? " · Super admin" : ""}</p>
            </div>
          </div>
          <ProfileForm name={user.name} bookName={book.name} isOwner={role === "owner"} />
        </Card>
        <Card>
          <CardTitle>Keluar</CardTitle>
          <p className="mb-4 text-sm text-muted">Keluar dari perangkat ini. Datamu tetap aman tersimpan.</p>
          <form action={signOut}>
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl border-2 border-latte px-4 text-sm font-bold text-ink hover:border-caramel">
              <LogOut className="size-4" /> Keluar
            </button>
          </form>
        </Card>
        <Card className="border-expense/30">
          <CardTitle>Hapus akun</CardTitle>
          <p className="mb-4 text-sm text-muted">
            Menghapus akun akan menghapus buku keuangan milikmu beserta semua transaksi, anggaran, target, dan tagihannya secara permanen. Jika kamu pasangan di buku orang lain, kamu hanya dikeluarkan dari buku itu. Unduh CSV dulu bila perlu arsip.
          </p>
          <DeleteAccountForm email={user.email} />
        </Card>
      </div>
    </div>
  );
}
