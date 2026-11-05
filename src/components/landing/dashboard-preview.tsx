import { ArrowDownLeft, ArrowUpRight, Coffee, Home, ShoppingBag, Wallet } from "lucide-react";
import { BomaCat } from "@/components/illustrations/boma-cat";

/** Cuplikan tampilan dashboard (data contoh) untuk landing page */
export function DashboardPreview() {
  const bars = [42, 58, 36, 70, 52, 64, 48];
  const tx = [
    { icon: Coffee, name: "Kopi pagi", cat: "Makan & minum", amt: "-Rp 28.000", out: true },
    { icon: Wallet, name: "Gaji Oktober", cat: "Pemasukan", amt: "+Rp 7.500.000", out: false },
    { icon: ShoppingBag, name: "Belanja bulanan", cat: "Kebutuhan rumah", amt: "-Rp 412.000", out: true },
  ];
  return (
    <div className="relative rounded-[28px] border border-line bg-card p-4 shadow-[0_24px_60px_-30px_rgba(122,79,51,0.45)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-5">
        {/* kartu sapaan */}
        <div className="relative overflow-hidden rounded-2xl bg-mocha-soft p-4 sm:col-span-3">
          <p className="text-sm font-semibold text-muted">Halo, Nadia</p>
          <p className="mt-1 font-display text-lg font-bold text-ink">Saldo kamu bulan ini</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-mocha">Rp 4.820.500</p>
          <div className="mt-3 flex flex-wrap gap-2 pr-20 text-xs font-semibold sm:pr-24">
            <span className="inline-flex items-center gap-1 rounded-full bg-income-soft px-2.5 py-1 text-income">
              <ArrowDownLeft className="size-3.5" /> Rp 7,5 jt masuk
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-expense-soft px-2.5 py-1 text-expense">
              <ArrowUpRight className="size-3.5" /> Rp 2,7 jt keluar
            </span>
          </div>
          <BomaCat pose="coin" className="absolute -right-3 -bottom-4 w-28 sm:w-32" title="" />
        </div>

        {/* anggaran */}
        <div className="rounded-2xl border border-line p-4 sm:col-span-2">
          <p className="text-sm font-bold text-ink">Anggaran makan</p>
          <p className="mt-0.5 text-xs text-muted">Rp 1.240.000 dari Rp 2.000.000</p>
          <div className="mt-3 h-3 rounded-full bg-latte-2">
            <div className="h-3 w-[62%] rounded-full bg-caramel" />
          </div>
          <p className="mt-4 text-sm font-bold text-ink">Tabungan liburan</p>
          <p className="mt-0.5 text-xs text-muted">Rp 3.600.000 dari Rp 5.000.000</p>
          <div className="mt-3 h-3 rounded-full bg-latte-2">
            <div className="h-3 w-[72%] rounded-full bg-income" />
          </div>
        </div>

        {/* grafik */}
        <div className="rounded-2xl border border-line p-4 sm:col-span-2">
          <p className="text-sm font-bold text-ink">Pengeluaran 7 hari</p>
          <div className="mt-4 flex h-24 items-end gap-2" aria-hidden>
            {bars.map((h, i) => (
              <div key={i} className={`flex-1 rounded-t-md ${i === 3 ? "bg-mocha" : "bg-latte"}`} style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-semibold text-muted">
            {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
        </div>

        {/* transaksi */}
        <div className="rounded-2xl border border-line p-4 sm:col-span-3">
          <p className="text-sm font-bold text-ink">Transaksi terakhir</p>
          <ul className="mt-2 divide-y divide-line">
            {tx.map((t) => (
              <li key={t.name} className="flex items-center gap-3 py-2">
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${t.out ? "bg-caramel-soft text-mocha" : "bg-income-soft text-income"}`}>
                  <t.icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{t.name}</span>
                  <span className="block truncate text-xs text-muted">{t.cat}</span>
                </span>
                <span className={`text-sm font-bold ${t.out ? "text-expense" : "text-income"}`}>{t.amt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold text-muted">
        <Home className="size-3.5 text-mocha" /> Contoh tampilan
      </span>
    </div>
  );
}
