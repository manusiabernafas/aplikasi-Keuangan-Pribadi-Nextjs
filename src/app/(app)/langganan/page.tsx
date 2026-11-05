import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Check, Clock, ShieldCheck, X } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/app/page-header";
import { BomaCat } from "@/components/illustrations/boma-cat";
import { Card, CardTitle } from "@/components/ui/card";
import { requireBook } from "@/lib/auth/session";
import { db, schema } from "@/lib/db";
import { TZ } from "@/lib/dates";
import { formatRupiah } from "@/lib/money";
import { getPlanByCode, getUserEntitlement } from "@/lib/server/plans";
import { refreshPayment, simulatePaid } from "@/lib/actions/billing";
import { PayButton } from "./pay-button";

export const metadata: Metadata = { title: "Langganan" };

const STATUS = {
  paid: { l: "Lunas", c: "bg-income-soft text-income" },
  pending: { l: "Menunggu", c: "bg-caramel-soft text-[#9a5f22]" },
  failed: { l: "Gagal", c: "bg-expense-soft text-expense" },
  expired: { l: "Kedaluwarsa", c: "bg-latte-2 text-muted" },
} as const;

const wib = (d: Date) => new Intl.DateTimeFormat("id-ID", { timeZone: TZ, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

export default async function LanggananPage({ searchParams }: PageProps<"/langganan">) {
  const { user, book, role } = await requireBook();
  const sp = await searchParams;
  const invoice = z.string().regex(/^BOMA-[\w-]{6,40}$/).safeParse(sp.invoice);
  const current = invoice.success ? await refreshPayment(invoice.data) : null;
  const [ent, premium, free, history] = await Promise.all([
    getUserEntitlement(user.id),
    getPlanByCode("premium"),
    getPlanByCode("free"),
    db.select().from(schema.payments).where(eq(schema.payments.userId, user.id)).orderBy(desc(schema.payments.createdAt)).limit(12),
  ]);
  const simulate = sp.simulasi === "1" && current?.status === "pending";
  const pf = premium?.features;
  const ff = free?.features;
  const lim = (v: number | null | undefined, unit: string) => (v == null ? "Tanpa batas" : `Maks. ${v} ${unit}`);

  const rows: [string, string | boolean, string | boolean][] = [
    ["Dompet", lim(ff?.maxWallets, "dompet"), lim(pf?.maxWallets, "dompet")],
    ["Target tabungan", lim(ff?.maxGoals, "target"), lim(pf?.maxGoals, "target")],
    ["Kategori", lim(ff?.maxCategories, "kategori"), lim(pf?.maxCategories, "kategori")],
    ["Ajak pasangan", !!ff?.partner, !!pf?.partner],
    ["Pengingat tagihan", !!ff?.bills, !!pf?.bills],
    ["Laporan bulan lalu & tren", !!ff?.fullReports, !!pf?.fullReports],
    ["Unduh CSV", !!ff?.export, !!pf?.export],
  ];

  return (
    <div>
      <PageHeader title="Langganan" text="Kelola paket Boma milikmu." />

      {current && (
        <Card className={`mb-5 flex items-center gap-4 ${current.status === "paid" ? "bg-income-soft" : current.status === "pending" ? "bg-caramel-soft" : "bg-expense-soft"}`}>
          <BomaCat pose={current.status === "paid" ? "happy" : current.status === "pending" ? "think" : "sit"} className="w-20 shrink-0" title="" />
          <div className="flex-1">
            <p className="font-display text-lg font-bold text-ink">
              {current.status === "paid" ? "Pembayaran berhasil! Premium sudah aktif." : current.status === "pending" ? "Menunggu pembayaran…" : "Pembayaran tidak berhasil."}
            </p>
            <p className="text-sm text-muted">
              {current.status === "pending" ? "Kalau sudah membayar, halaman ini akan diperbarui. Muat ulang dalam beberapa detik." : `Invoice ${current.invoiceNumber}`}
            </p>
            {simulate && (
              <form action={simulatePaid} className="mt-3">
                <input type="hidden" name="invoice" value={current.invoiceNumber} />
                <button className="rounded-xl bg-mocha px-3 py-2 text-sm font-bold text-white">Simulasikan lunas (uji lokal)</button>
              </form>
            )}
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card className="relative overflow-hidden bg-mocha p-7 text-white">
          <p className="text-sm font-bold tracking-wide text-white/75 uppercase">Paket kamu</p>
          <p className="mt-1 font-display text-3xl font-extrabold">{ent.planName}</p>
          {ent.premium && ent.periodEnd ? (
            <p className="mt-2 flex items-center gap-2 text-white/85"><Clock className="size-4" /> Aktif sampai {wib(ent.periodEnd)} WIB</p>
          ) : (
            <p className="mt-2 text-white/85">Fitur dasar, gratis selamanya.</p>
          )}
          {role === "partner" && <p className="mt-4 rounded-2xl bg-white/15 px-4 py-3 text-sm">Kamu sedang di buku milik pasanganmu ({book.name}). Fitur di buku ini mengikuti paket pemiliknya.</p>}
          <BomaCat pose={ent.premium ? "happy" : "sit"} className="absolute -right-3 -bottom-4 w-32 opacity-95" title="" />
          <div className="relative mt-8 max-w-[calc(100%-6rem)]">
            {premium && premium.active && premium.price > 0 ? (
              <>
                <p className="font-display text-4xl font-extrabold">{formatRupiah(premium.price)}</p>
                <p className="mb-4 text-white/80">per {premium.periodDays} hari · tanpa perpanjangan otomatis</p>
                <div className="rounded-2xl bg-white p-1">
                  <PayButton label={ent.premium ? `Perpanjang ${premium.periodDays} hari` : "Upgrade ke Premium"} />
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-white/80"><ShieldCheck className="size-4" /> Diproses aman oleh DOKU: QRIS, VA bank, e-wallet, kartu.</p>
              </>
            ) : (
              <p className="text-white/85">Paket Premium sedang tidak tersedia.</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Bandingkan paket</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="py-2 font-semibold">Fitur</th>
                  <th className="py-2 font-semibold">{free?.name ?? "Gratis"}</th>
                  <th className="py-2 font-semibold text-mocha">{premium?.name ?? "Premium"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(([f, a, b]) => (
                  <tr key={f}>
                    <td className="py-2.5 pr-2 font-semibold text-ink">{f}</td>
                    {[a, b].map((v, i) => (
                      <td key={i} className="py-2.5 pr-2 text-muted">
                        {typeof v === "boolean" ? v ? <Check className="size-4 text-income" strokeWidth={3} aria-label="Ya" /> : <X className="size-4 text-latte" aria-label="Tidak" /> : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {history.length > 0 && (
        <Card className="mt-5">
          <CardTitle>Riwayat pembayaran</CardTitle>
          <ul className="divide-y divide-line">
            {history.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{p.invoiceNumber}</span>
                  <span className="text-xs text-muted">{wib(p.createdAt)} WIB{p.paymentMethod ? ` · ${p.paymentMethod}` : ""}</span>
                </span>
                <span className="font-bold text-ink tabular-nums">{formatRupiah(p.amount)}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[p.status].c}`}>{STATUS[p.status].l}</span>
                {p.status === "pending" && p.paymentUrl && p.expiresAt > new Date() && (
                  <a href={p.paymentUrl} className="font-bold text-mocha underline" rel="noopener">Lanjutkan bayar</a>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Batas bayar 60 menit sejak dibuat. Tanggal ditampilkan dalam WIB.</p>
        </Card>
      )}
    </div>
  );
}
