import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search, X } from "lucide-react";
import { z } from "zod";
import { MonthNav, monthFromParam } from "@/components/app/month-nav";
import { PageHeader } from "@/components/app/page-header";
import { TxList } from "@/components/app/tx-list";
import { QuickAdd } from "@/components/app/quick-add";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { buttonClass } from "@/components/ui/button";
import { requireBook } from "@/lib/auth/session";
import { monthEnd } from "@/lib/dates";
import { formatRupiah, formatRupiahShort } from "@/lib/money";
import { getBookEntitlement } from "@/lib/server/plans";
import { getCategories, getWallets, listTransactions } from "@/lib/server/queries";

export const metadata: Metadata = { title: "Transaksi" };

const filterSchema = z.object({
  jenis: z.enum(["income", "expense", "transfer"]).optional().catch(undefined),
  dompet: z.uuid().optional().catch(undefined),
  kategori: z.uuid().optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined),
  hal: z.coerce.number().int().min(1).max(500).optional().catch(undefined),
});

export default async function TransaksiPage({ searchParams }: PageProps<"/transaksi">) {
  const { book } = await requireBook();
  const sp = await searchParams;
  const month = monthFromParam(sp.bulan);
  const f = filterSchema.parse({ jenis: sp.jenis, dompet: sp.dompet, kategori: sp.kategori, q: sp.q || undefined, hal: sp.hal });
  const page = f.hal ?? 1;
  const [wallets, categories, ent, list] = await Promise.all([
    getWallets(book.id, true),
    getCategories(book.id),
    getBookEntitlement(book.ownerId),
    listTransactions(book.id, { from: month, to: monthEnd(month), kind: f.jenis, walletId: f.dompet, categoryId: f.kategori, q: f.q }, 1, page * 30),
  ]);
  const w = wallets.filter((x) => !x.archived).map((x) => ({ id: x.id, name: x.name, balance: x.balance }));
  const c = categories.map((x) => ({ id: x.id, name: x.name, kind: x.kind, icon: x.icon, color: x.color }));
  const params = { jenis: f.jenis, dompet: f.dompet, kategori: f.kategori, q: f.q };
  const filtered = Boolean(f.jenis || f.dompet || f.kategori || f.q);
  const qs = (extra: Record<string, string>) => new URLSearchParams(Object.fromEntries(Object.entries({ ...params, bulan: month.slice(0, 7), ...extra }).filter(([, v]) => v)) as Record<string, string>).toString();

  return (
    <div>
      <PageHeader
        title="Transaksi"
        text="Semua uang masuk, keluar, dan pindah dompet."
        pose="coin"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <MonthNav month={month} path="/transaksi" params={params} />
            {ent.features.export ? (
              <a href={`/api/ekspor?${qs({})}`} className={buttonClass({ variant: "secondary" })}>
                <Download className="size-4" /> Unduh CSV
              </a>
            ) : (
              <Link href="/langganan" className={buttonClass({ variant: "secondary" })} title="Fitur Premium">
                <Download className="size-4" /> Unduh CSV
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { l: "Pemasukan", v: list.totals.income, c: "text-income" },
          { l: "Pengeluaran", v: list.totals.expense, c: "text-expense" },
          { l: "Selisih", v: list.totals.income - list.totals.expense, c: "text-ink" },
        ].map((x) => (
          <Card key={x.l} className="p-4">
            <p className="text-xs font-semibold text-muted sm:text-sm">{x.l}</p>
            <p className={`mt-1 truncate font-display text-base font-extrabold tabular-nums sm:text-xl ${x.c}`}>
              <span className="sm:hidden">{x.l === "Selisih" && x.v > 0 ? "+" : ""}{formatRupiahShort(x.v)}</span>
              <span className="hidden sm:inline">{formatRupiah(x.v, { sign: x.l === "Selisih" })}</span>
            </p>
          </Card>
        ))}
      </div>

      <form method="get" className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]" role="search">
        <input type="hidden" name="bulan" value={month.slice(0, 7)} />
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <Input name="q" defaultValue={f.q} placeholder="Cari catatan…" maxLength={60} className="pl-10" aria-label="Cari catatan" />
        </div>
        <Select name="jenis" defaultValue={f.jenis ?? ""} aria-label="Jenis">
          <option value="">Semua jenis</option>
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
          <option value="transfer">Transfer</option>
        </Select>
        <Select name="dompet" defaultValue={f.dompet ?? ""} aria-label="Dompet">
          <option value="">Semua dompet</option>
          {wallets.map((x) => (
            <option key={x.id} value={x.id}>{x.name}{x.archived ? " (arsip)" : ""}</option>
          ))}
        </Select>
        <Select name="kategori" defaultValue={f.kategori ?? ""} aria-label="Kategori">
          <option value="">Semua kategori</option>
          {categories.map((x) => (
            <option key={x.id} value={x.id}>{x.kind === "income" ? "Masuk · " : ""}{x.name}</option>
          ))}
        </Select>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass({ className: "flex-1" })}>Terapkan</button>
          {filtered && (
            <Link href={`/transaksi?bulan=${month.slice(0, 7)}`} className={buttonClass({ variant: "ghost" })} aria-label="Hapus filter">
              <X className="size-4" />
            </Link>
          )}
        </div>
      </form>

      <Card>
        {list.rows.length ? (
          <>
            <TxList rows={list.rows} wallets={w} categories={c} showAuthor />
            {list.hasMore && (
              <div className="mt-5 text-center">
                <Link href={`/transaksi?${qs({ hal: String(page + 1) })}`} scroll={false} className={buttonClass({ variant: "soft" })}>
                  Muat lebih banyak
                </Link>
              </div>
            )}
            <p className="mt-4 text-center text-xs text-muted">{list.totals.count} transaksi</p>
          </>
        ) : (
          <EmptyState
            pose={filtered ? "think" : "sleep"}
            title={filtered ? "Tidak ada yang cocok" : "Belum ada transaksi di bulan ini"}
            text={filtered ? "Coba ubah atau hapus filternya." : "Catat pemasukan atau pengeluaran pertamamu."}
            action={!filtered && <QuickAdd wallets={w} categories={c} />}
          />
        )}
      </Card>
    </div>
  );
}
