import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireBook } from "@/lib/auth/session";
import { monthEnd } from "@/lib/dates";
import { getBookEntitlement } from "@/lib/server/plans";
import { listTransactions } from "@/lib/server/queries";
import { rateLimit } from "@/lib/security/rate-limit";

/** Netralkan formula spreadsheet (CSV injection) dan kutip setiap sel */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

const q = z.object({
  bulan: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().catch(undefined),
  jenis: z.enum(["income", "expense", "transfer"]).optional().catch(undefined),
  dompet: z.uuid().optional().catch(undefined),
  kategori: z.uuid().optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined),
});

export async function GET(req: Request) {
  if (!(await getSessionUser())) return NextResponse.json({ error: "Silakan masuk dulu." }, { status: 401 });
  const { user, book } = await requireBook();
  const ent = await getBookEntitlement(book.ownerId);
  if (!ent.features.export) return NextResponse.json({ error: "Ekspor adalah fitur Premium." }, { status: 403 });
  if (!rateLimit(`export:${user.id}`, 10, 60).ok) return NextResponse.json({ error: "Terlalu sering. Coba lagi sebentar." }, { status: 429 });

  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = q.parse(sp);
  const month = `${f.bulan ?? new Date().toISOString().slice(0, 7)}-01`;
  const { rows } = await listTransactions(book.id, { from: month, to: monthEnd(month), kind: f.jenis, walletId: f.dompet, categoryId: f.kategori, q: f.q || undefined }, 1, 10000);
  const KIND = { income: "Pemasukan", expense: "Pengeluaran", transfer: "Transfer" } as const;
  const lines = [
    ["Tanggal", "Jenis", "Kategori", "Dompet", "Dompet tujuan", "Nominal", "Catatan", "Dicatat oleh"].map(cell).join(","),
    ...rows.map((r) => [r.occurredOn, KIND[r.kind], r.categoryName ?? "", r.walletName, r.toWalletName ?? "", r.amount, r.note ?? "", r.createdByName ?? ""].map(cell).join(",")),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="boma-transaksi-${month.slice(0, 7)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
