import type { Metadata } from "next";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FormDialog } from "@/components/app/form-dialog";
import { ActionButton } from "@/components/app/confirm-form";
import { CategoryIcon } from "@/components/category-icon";
import { Card, CardTitle } from "@/components/ui/card";
import { setCategoryArchived } from "@/lib/actions/finance";
import { requireBook } from "@/lib/auth/session";
import { getCategories } from "@/lib/server/queries";
import { CategoryForm } from "./category-form";

export const metadata: Metadata = { title: "Kategori" };

export default async function KategoriPage() {
  const { book } = await requireBook();
  const all = await getCategories(book.id, true);
  return (
    <div>
      <PageHeader title="Kategori" text="Kelompokkan transaksi supaya laporan lebih jelas. Kategori yang disembunyikan tetap ada di riwayat." pose="sit" />
      <div className="grid gap-5 lg:grid-cols-2">
        {(["expense", "income"] as const).map((kind) => {
          const list = all.filter((c) => c.kind === kind);
          return (
            <Card key={kind}>
              <CardTitle
                action={
                  <FormDialog title={kind === "expense" ? "Kategori pengeluaran baru" : "Kategori pemasukan baru"} variant="soft" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-mocha-soft px-3 text-sm font-bold text-mocha hover:bg-latte" trigger={<><Plus className="size-4" /> Tambah</>}>
                    <CategoryForm kind={kind} />
                  </FormDialog>
                }
              >
                {kind === "expense" ? "Pengeluaran" : "Pemasukan"}
              </CardTitle>
              <ul className="divide-y divide-line">
                {list.map((c) => (
                  <li key={c.id} className={`flex items-center gap-3 py-2.5 ${c.archived ? "opacity-55" : ""}`}>
                    <CategoryIcon icon={c.icon} color={c.color} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                      {c.name}
                      {c.archived && <span className="ml-2 text-xs font-bold text-muted">disembunyikan</span>}
                    </span>
                    <FormDialog title="Ubah kategori" className="grid size-9 place-items-center rounded-xl text-muted hover:bg-latte-2" triggerLabel={`Ubah ${c.name}`} trigger={<Pencil className="size-4" />}>
                      <CategoryForm kind={kind} defaults={c} />
                    </FormDialog>
                    <ActionButton action={setCategoryArchived} fields={{ id: c.id, archived: c.archived ? "0" : "1" }} pendingText="" className="size-9 px-0">
                      {c.archived ? <Eye className="size-4" aria-label="Tampilkan" /> : <EyeOff className="size-4" aria-label="Sembunyikan" />}
                    </ActionButton>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
