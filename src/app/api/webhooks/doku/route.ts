import { NextResponse } from "next/server";
import { applyPaymentStatus } from "@/lib/server/billing";
import { mapDokuStatus, verifyWebhook } from "@/lib/payment/doku";

// Notifikasi pembayaran dari DOKU. Idempoten: pengiriman ulang untuk invoice yang sudah lunas diabaikan.
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  if (!verifyWebhook(raw, req.headers)) return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  let body: { order?: { invoice_number?: string; amount?: number }; transaction?: { status?: string }; channel?: { id?: string } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const invoice = body.order?.invoice_number;
  if (!invoice || !/^BOMA-[\w-]{6,40}$/.test(invoice)) return NextResponse.json({ error: "unknown invoice" }, { status: 400 });
  const r = await applyPaymentStatus(invoice, mapDokuStatus(body.transaction?.status), { amount: body.order?.amount != null ? Number(body.order.amount) : null, method: body.channel?.id ?? null });
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
