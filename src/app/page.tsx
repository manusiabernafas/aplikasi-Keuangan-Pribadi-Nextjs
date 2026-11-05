import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Check,
  ChevronDown,
  FileBarChart,
  Lock,
  Menu,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Target,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BomaCat } from "@/components/illustrations/boma-cat";
import {
  BudgetPieArt,
  CalendarArt,
  GoalArt,
  HomeHeartArt,
  JarArt,
  Paw,
  ReceiptArt,
  ShieldArt,
  WalletArt,
} from "@/components/illustrations/scenes";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { formatRupiah } from "@/lib/utils";
import { getPlanByCode } from "@/lib/server/plans";

const nav = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#pasangan", label: "Untuk pasangan" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

const features = [
  { art: ReceiptArt, icon: ReceiptText, title: "Catat dalam 5 detik", text: "Ketik nominal, pilih kategori, selesai. Boma ingat kategori yang sering kamu pakai.", tone: "bg-caramel-soft" },
  { art: BudgetPieArt, icon: PiggyBank, title: "Anggaran per kategori", text: "Tentukan batas belanja bulanan dan lihat sisanya kapan saja, sebelum kebablasan.", tone: "bg-mocha-soft" },
  { art: GoalArt, icon: Target, title: "Target tabungan", text: "Liburan, dana darurat, DP rumah. Pantau progresnya dan berapa yang perlu disisihkan.", tone: "bg-nose-soft" },
  { art: CalendarArt, icon: BellRing, title: "Pengingat tagihan", text: "Listrik, cicilan, langganan. Boma mengingatkan sebelum jatuh tempo.", tone: "bg-sky-soft" },
  { art: WalletArt, icon: WalletCards, title: "Banyak dompet", text: "Tunai, rekening bank, e-wallet. Transfer antar dompet tercatat rapi tanpa dobel hitung.", tone: "bg-income-soft" },
  { art: JarArt, icon: FileBarChart, title: "Laporan yang mudah dibaca", text: "Grafik bulanan, kategori terboros, dan tren tabungan. Bisa diunduh untuk arsip.", tone: "bg-latte-2" },
];

const steps = [
  { pose: "wave" as const, title: "Masuk dengan Google", text: "Satu klik, tanpa perlu mengingat kata sandi baru." },
  { pose: "coin" as const, title: "Catat uang masuk & keluar", text: "Mulai dari saldo sekarang, lalu catat setiap transaksi." },
  { pose: "chart" as const, title: "Lihat ke mana uangmu pergi", text: "Boma merangkum semuanya jadi grafik dan saran sederhana." },
];

const freeFeatures = ["Catat pemasukan & pengeluaran", "Hingga 2 dompet", "Anggaran bulanan", "1 target tabungan", "Laporan bulan berjalan"];
const premiumFeatures = [
  "Semua fitur Gratis",
  "Dompet & target tanpa batas",
  "Ajak pasangan kelola bersama",
  "Pengingat tagihan rutin",
  "Laporan lengkap & ekspor",
  "Kategori kustom tanpa batas",
];

const faqs = [
  { q: "Apakah Boma terhubung ke rekening bank saya?", a: "Tidak. Boma tidak meminta akses ke rekening, PIN, atau m-banking kamu. Semua transaksi dicatat sendiri, sehingga data bank kamu tetap aman." },
  { q: "Bagaimana cara mengajak pasangan?", a: "Di menu Pasangan, kirim undangan ke email pasanganmu. Setelah ia masuk dengan Google dan menerima undangan, kalian bisa mencatat di buku keuangan yang sama." },
  { q: "Pembayaran Premium pakai apa?", a: "Pembayaran diproses oleh DOKU: QRIS, virtual account bank, e-wallet, dan kartu. Langganan berlaku 1 bulan dan bisa diperpanjang kapan saja." },
  { q: "Kalau berhenti Premium, data saya hilang?", a: "Tidak. Data tetap tersimpan. Kamu kembali ke paket Gratis, dan fitur Premium terkunci sampai kamu berlangganan lagi." },
  { q: "Apakah data saya bisa dihapus?", a: "Bisa. Kamu dapat mengekspor lalu menghapus akun beserta seluruh datanya dari halaman Pengaturan." },
];

// Harga diambil dari paket yang diatur super admin
export const dynamic = "force-dynamic";

async function premiumPrice() {
  try {
    return (await getPlanByCode("premium"))?.price ?? 29000;
  } catch {
    return 29000;
  }
}

export default async function Home() {
  const PREMIUM_PRICE = await premiumPrice();
  return (
    <div className="overflow-x-clip">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-latte-2 hover:text-ink">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/masuk" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-mocha hover:bg-latte-2 sm:inline-flex">
              Masuk
            </Link>
            <Link href="/masuk" className="inline-flex items-center gap-1.5 rounded-xl bg-mocha px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-mocha-hover">
              Mulai gratis
            </Link>
            <details className="group relative md:hidden">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-line bg-card text-ink [&::-webkit-details-marker]:hidden" aria-label="Buka menu">
                <Menu className="size-5" />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-card p-2 shadow-lg">
                {nav.map((n) => (
                  <a key={n.href} href={n.href} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink hover:bg-latte-2">
                    {n.label}
                  </a>
                ))}
                <Link href="/masuk" className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-bold text-mocha hover:bg-latte-2">
                  Masuk
                </Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative">
          <Paw className="absolute bottom-6 left-[3%] hidden size-8 rotate-[-20deg] text-latte xl:block" />
          <Paw className="absolute bottom-16 left-[6%] hidden size-6 rotate-[10deg] text-latte xl:block" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs font-bold text-mocha">
                <span className="size-2 rounded-full bg-income" /> Teman kecil untuk dompetmu
              </span>
              <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold text-ink sm:text-5xl lg:text-6xl">
                Atur uang jadi{" "}
                <span className="relative whitespace-nowrap text-mocha">
                  tenang
                  <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 w-full" aria-hidden>
                    <path d="M3 8 C 50 2 150 2 197 8" fill="none" stroke="#d99b5b" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </span>
                ,<br className="hidden sm:block" /> bareng Boma.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                Catat pemasukan dan pengeluaran, pasang anggaran, kejar target tabungan, dan kelola keuangan bersama pasangan. Semua dalam satu tempat yang hangat dan mudah dipahami.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/masuk" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-mocha px-6 py-4 text-base font-bold text-white transition-colors hover:bg-mocha-hover">
                  Mulai gratis dengan Google <ArrowRight className="size-5" />
                </Link>
                <a href="#fitur" className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-latte bg-card px-6 py-4 text-base font-bold text-ink transition-colors hover:border-caramel">
                  Lihat fiturnya
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-muted">
                {["Gratis selamanya", "Tanpa akses rekening bank", "Data terenkripsi"].map((t) => (
                  <li key={t} className="inline-flex items-center gap-1.5">
                    <Check className="size-4 text-income" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute inset-x-6 top-6 bottom-0 rounded-[40px] bg-latte-2" aria-hidden />
              <div className="relative px-4 pt-2 pb-6">
                <BomaCat pose="wave" animated className="boma-float mx-auto w-64 sm:w-80 lg:w-[22rem]" title="Boma melambaikan tangan" />
                <div className="absolute top-10 -left-1 rounded-2xl border border-line bg-card px-4 py-3 shadow-sm sm:left-0">
                  <p className="text-xs font-semibold text-muted">Sisa anggaran</p>
                  <p className="font-display text-lg font-extrabold text-income">Rp 760.000</p>
                </div>
                <div className="absolute right-0 bottom-16 rounded-2xl border border-line bg-card px-4 py-3 shadow-sm">
                  <p className="text-xs font-semibold text-muted">Tabungan liburan</p>
                  <div className="mt-1.5 h-2 w-32 rounded-full bg-latte-2">
                    <div className="h-2 w-[72%] rounded-full bg-caramel" />
                  </div>
                  <p className="mt-1 text-xs font-bold text-ink">72% tercapai</p>
                </div>
                <div className="absolute top-2 right-6 grid size-14 place-items-center rounded-2xl border border-line bg-card shadow-sm">
                  <JarArt className="size-11" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STRIP */}
        <section aria-label="Ringkasan" className="border-y border-line bg-card">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            {[
              { k: "5 detik", v: "untuk mencatat satu transaksi" },
              { k: "2 orang", v: "bisa kelola satu buku keuangan" },
              { k: "0 akses", v: "ke rekening atau PIN bank kamu" },
              { k: "24/7", v: "data tersimpan & dicadangkan" },
            ].map((x) => (
              <div key={x.k}>
                <p className="font-display text-2xl font-extrabold text-mocha sm:text-3xl">{x.k}</p>
                <p className="mt-1 text-sm text-muted">{x.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FITUR */}
        <section id="fitur" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHead eyebrow="Fitur" title="Semua yang kamu butuhkan untuk rapi soal uang" text="Dibuat sederhana untuk dipakai setiap hari, tapi cukup lengkap untuk rencana jangka panjang." />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <article key={f.title} className="group rounded-3xl border border-line bg-card p-5 transition-transform hover:-translate-y-1">
                  <div className={`grid h-40 place-items-center rounded-2xl ${f.tone}`}>
                    <f.art className="h-32 w-auto transition-transform group-hover:scale-105" />
                  </div>
                  <h3 className="mt-5 flex items-center gap-2 text-lg font-bold text-ink">
                    <f.icon className="size-5 text-mocha" /> {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PREVIEW */}
        <section className="bg-cream-2">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionHead align="left" eyebrow="Dashboard" title="Satu layar, semua jelas" text="Saldo, anggaran, tabungan, dan transaksi terbaru langsung terlihat begitu kamu membuka Boma. Tidak perlu mengutak-atik spreadsheet." />
              <ul className="mt-6 space-y-3">
                {["Ringkasan bulan berjalan otomatis", "Peringatan saat anggaran hampir habis", "Grafik pengeluaran harian dan bulanan"].map((t) => (
                  <li key={t} className="flex items-start gap-3 text-ink">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-income-soft">
                      <Check className="size-3.5 text-income" strokeWidth={3} />
                    </span>
                    <span className="font-semibold">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <DashboardPreview />
          </div>
        </section>

        {/* CARA KERJA */}
        <section id="cara-kerja" className="scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHead eyebrow="Cara kerja" title="Mulai dalam tiga langkah" text="Tidak perlu belajar istilah akuntansi. Kalau bisa chat, kamu bisa pakai Boma." />
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((st, i) => (
                <li key={st.title} className="relative rounded-3xl border border-line bg-card p-6 text-center">
                  <span className="absolute top-5 left-5 grid size-9 place-items-center rounded-full bg-mocha font-display font-bold text-white">{i + 1}</span>
                  <BomaCat pose={st.pose} className="mx-auto w-40" title="" />
                  <h3 className="mt-3 text-lg font-bold text-ink">{st.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{st.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PASANGAN */}
        <section id="pasangan" className="scroll-mt-20 px-4 sm:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-10 rounded-[36px] bg-mocha px-6 py-12 text-white sm:px-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                <Users className="size-4" /> Fitur Premium
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Kelola uang berdua, tanpa saling tebak</h2>
              <p className="mt-4 text-lg leading-relaxed text-white/85">
                Ajak pasanganmu masuk ke buku keuangan yang sama. Kalian berdua bisa mencatat, melihat anggaran rumah tangga, dan menabung untuk target bersama. Setiap transaksi menampilkan siapa yang mencatatnya.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Undang lewat email", "Hak akses bisa dicabut", "Catatan siapa yang input", "Target tabungan bersama"].map((t) => (
                  <li key={t} className="flex items-center gap-2 font-semibold">
                    <Check className="size-4 text-caramel" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 flex items-end justify-center lg:order-2">
              <BomaCat pose="happy" className="w-36 sm:w-52" title="Boma" />
              <HomeHeartArt className="mb-4 w-20 sm:w-32" />
              <BomaCat pose="sit" variant="mochi" className="w-32 sm:w-48" title="Mochi, pasangan Boma" />
            </div>
          </div>
        </section>

        {/* KEAMANAN */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div className="mx-auto grid size-64 place-items-center rounded-full bg-sky-soft sm:size-72">
              <ShieldArt className="w-48" title="Perisai keamanan" />
            </div>
            <div>
              <SectionHead align="left" eyebrow="Keamanan" title="Uangmu urusan pribadi. Kami menjaganya begitu." />
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Lock, t: "Koneksi terenkripsi", d: "Semua data dikirim lewat HTTPS dan disimpan di server yang kami kelola sendiri." },
                  { icon: ShieldCheck, t: "Masuk lewat Google", d: "Tidak ada kata sandi yang disimpan di Boma, sehingga tidak ada yang bisa bocor." },
                  { icon: Zap, t: "Terlindung dari serangan", d: "Pembatasan percobaan, perlindungan CSRF, dan validasi ketat di setiap isian." },
                  { icon: Users, t: "Kamu yang memegang kendali", d: "Ekspor dan hapus datamu kapan saja. Kami tidak menjual data ke siapa pun." },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl border border-line bg-card p-5">
                    <x.icon className="size-6 text-mocha" />
                    <p className="mt-3 font-bold text-ink">{x.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{x.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* HARGA */}
        <section id="harga" className="scroll-mt-20 bg-cream-2">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <SectionHead eyebrow="Harga" title="Mulai gratis, upgrade kalau perlu" text="Tidak ada kontrak. Premium dibayar per bulan dan bisa berhenti kapan saja." />
            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-3xl border border-line bg-card p-7">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-ink">Gratis</h3>
                  <BomaCat pose="sit" className="w-20" title="" />
                </div>
                <p className="mt-2 font-display text-4xl font-extrabold text-ink">Rp 0</p>
                <p className="text-sm text-muted">selamanya</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {freeFeatures.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm font-medium text-ink">
                      <Check className="mt-0.5 size-4 shrink-0 text-income" strokeWidth={3} /> {t}
                    </li>
                  ))}
                </ul>
                <Link href="/masuk" className="mt-8 inline-flex items-center justify-center rounded-2xl border-2 border-latte px-5 py-3 font-bold text-ink hover:border-caramel">
                  Mulai gratis
                </Link>
              </div>
              <div className="relative flex flex-col rounded-3xl border-2 border-mocha bg-card p-7">
                <span className="absolute -top-3.5 left-7 rounded-full bg-caramel px-3 py-1 text-xs font-bold text-ink">Paling lengkap</span>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-ink">Premium</h3>
                  <BomaCat pose="happy" className="w-20" title="" />
                </div>
                <p className="mt-2 font-display text-4xl font-extrabold text-mocha">{formatRupiah(PREMIUM_PRICE)}</p>
                <p className="text-sm text-muted">per bulan</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {premiumFeatures.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-sm font-medium text-ink">
                      <Check className="mt-0.5 size-4 shrink-0 text-mocha" strokeWidth={3} /> {t}
                    </li>
                  ))}
                </ul>
                <Link href="/masuk?lanjut=premium" className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-mocha px-5 py-3 font-bold text-white hover:bg-mocha-hover">
                  Coba Premium <ArrowRight className="size-4" />
                </Link>
                <p className="mt-3 text-center text-xs text-muted">Pembayaran aman lewat DOKU: QRIS, VA bank, e-wallet</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <SectionHead align="left" eyebrow="FAQ" title="Yang sering ditanyakan" />
              <BomaCat pose="think" className="mt-6 hidden w-56 lg:block" title="Boma sedang berpikir" />
            </div>
            <div className="space-y-3">
              {faqs.map((f) => (
                <details key={f.q} className="group rounded-2xl border border-line bg-card p-5 open:border-latte">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 rounded-[36px] border border-line bg-caramel-soft px-6 py-12 text-center sm:flex-row sm:text-left md:px-12">
            <BomaCat pose="sleep" className="w-40 shrink-0" title="Boma tidur nyenyak" />
            <div className="flex-1">
              <h2 className="text-3xl font-extrabold text-ink">Tidur nyenyak, keuangan beres.</h2>
              <p className="mt-2 text-lg text-muted">Mulai catat hari ini. Gratis, dan cukup satu klik dengan akun Google.</p>
            </div>
            <Link href="/masuk" className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-mocha px-6 py-4 font-bold text-white hover:bg-mocha-hover">
              Mulai sekarang <ArrowRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-sm text-muted">Aplikasi pencatat keuangan pribadi dan keluarga, ditemani kucing kecil yang teliti.</p>
          </div>
          <nav aria-label="Tautan kaki" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted">
            <Link href="/syarat" className="hover:text-ink">Syarat layanan</Link>
            <Link href="/privasi" className="hover:text-ink">Kebijakan privasi</Link>
            <a href="#faq" className="hover:text-ink">Bantuan</a>
          </nav>
        </div>
        <p className="border-t border-line py-4 text-center text-xs text-muted">© 2026 Boma. Dibuat di Indonesia.</p>
      </footer>
    </div>
  );
}

function SectionHead({ eyebrow, title, text, align = "center" }: { eyebrow: string; title: string; text?: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="inline-flex items-center gap-1.5 text-sm font-bold tracking-wide text-mocha uppercase">
        <Paw className="size-4 text-caramel" /> {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl leading-tight font-extrabold text-ink sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-muted">{text}</p>}
    </div>
  );
}
