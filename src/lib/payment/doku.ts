import "server-only";
import crypto from "node:crypto";
import { serverEnv } from "@/lib/env.server";

/**
 * DOKU Checkout (Jokul, non-SNAP). Semua request ditandatangani HMAC-SHA256 atas
 * Client-Id, Request-Id, Request-Timestamp, Request-Target (+ Digest bila ada body).
 * Notifikasi (webhook) dari DOKU ditandatangani dengan skema yang sama.
 */
const BASE = { production: "https://api.doku.com", sandbox: "https://api-sandbox.doku.com" } as const;
export const WEBHOOK_PATH = "/api/webhooks/doku";

export type DokuStatus = "paid" | "pending" | "failed" | "expired";
const STATUS: Record<string, DokuStatus> = { success: "paid", paid: "paid", pending: "pending", failed: "failed", expired: "expired", expire: "expired", cancelled: "failed", canceled: "failed", void: "failed" };
export const mapDokuStatus = (s: unknown): DokuStatus => STATUS[String(s ?? "").toLowerCase()] ?? "pending";

function cfg() {
  const env = serverEnv();
  return { clientId: env.DOKU_CLIENT_ID.trim(), secret: env.DOKU_SECRET_KEY.trim(), base: BASE[env.DOKU_ENV] };
}

export function dokuConfigured() {
  const c = cfg();
  return Boolean(c.clientId && c.secret);
}

function sign(clientId: string, secret: string, requestId: string, timestamp: string, target: string, body: string) {
  const digest = body ? crypto.createHash("sha256").update(body).digest("base64") : "";
  let s = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${target}`;
  if (body) s += `\nDigest:${digest}`;
  return { signature: `HMACSHA256=${crypto.createHmac("sha256", secret).update(s).digest("base64")}`, digest };
}

async function request(method: "GET" | "POST", path: string, bodyObj?: unknown) {
  const { clientId, secret, base } = cfg();
  if (!clientId || !secret) throw new Error("DOKU belum dikonfigurasi");
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  const { signature, digest } = sign(clientId, secret, requestId, timestamp, path, body);
  const res = await fetch(base + path, {
    method,
    headers: { "Client-Id": clientId, "Request-Id": requestId, "Request-Timestamp": timestamp, Signature: signature, ...(body ? { Digest: digest, "Content-Type": "application/json" } : {}) },
    body: body || undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text);
  } catch {
    // bukan JSON
  }
  return { ok: res.ok, status: res.status, json, text };
}

/** Buat halaman pembayaran DOKU Checkout; mengembalikan URL untuk diarahkan. */
export async function createCheckout(p: { invoice: string; amount: number; name: string; email: string; callbackUrl: string; dueMinutes: number; itemName: string }) {
  const res = await request("POST", "/checkout/v1/payment", {
    order: {
      invoice_number: p.invoice,
      amount: p.amount,
      currency: "IDR",
      callback_url: p.callbackUrl,
      callback_url_cancel: p.callbackUrl,
      auto_redirect: true,
      line_items: [{ name: p.itemName.slice(0, 64), price: p.amount, quantity: 1 }],
    },
    payment: { payment_due_date: p.dueMinutes },
    customer: { name: p.name.slice(0, 64) || "Pengguna Boma", email: p.email },
  });
  const data = res.json as { response?: { payment?: { url?: string } } };
  const url = data.response?.payment?.url;
  if (!res.ok || !url) {
    console.error(`[doku] checkout gagal ${res.status}`, res.text.slice(0, 500));
    throw new Error("DOKU checkout gagal");
  }
  return url;
}

export async function checkStatus(invoice: string): Promise<{ status: DokuStatus; amount: number | null; method: string | null }> {
  const res = await request("GET", `/orders/v1/status/${encodeURIComponent(invoice)}`);
  if (!res.ok) return { status: "pending", amount: null, method: null };
  const d = res.json as { transaction?: { status?: string }; order?: { amount?: number }; channel?: { id?: string } };
  return { status: mapDokuStatus(d.transaction?.status), amount: d.order?.amount != null ? Number(d.order.amount) : null, method: d.channel?.id ?? null };
}

export function verifyWebhook(rawBody: string, headers: Headers) {
  const { clientId, secret } = cfg();
  if (!clientId || !secret) return false;
  const sig = headers.get("signature");
  const reqId = headers.get("request-id");
  const ts = headers.get("request-timestamp");
  if (!sig || !reqId || !ts) return false;
  const { signature } = sign(headers.get("client-id") ?? clientId, secret, reqId, ts, WEBHOOK_PATH, rawBody);
  const a = Buffer.from(sig);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
