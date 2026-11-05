import { BomaCat } from "@/components/illustrations/boma-cat";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <BomaCat pose="think" className="w-44" title="Boma kebingungan" />
      <p className="mt-4 font-display text-6xl font-extrabold text-latte">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-ink">Halaman ini tidak ditemukan</h1>
      <p className="mt-2 max-w-sm text-muted">Boma sudah mencari ke mana-mana, tapi halamannya tidak ada. Mungkin tautannya salah ketik.</p>
      <ButtonLink href="/" className="mt-6">Kembali ke beranda</ButtonLink>
    </div>
  );
}
