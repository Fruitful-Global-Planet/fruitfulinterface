import process from "node:process";

const PAYSTACK_API = "https://api.paystack.co";

// Server-only helpers. The .server.ts suffix keeps PAYSTACK_SECRET_KEY out of
// the browser bundle — the key must be set as a server-side env var
// (Lovable Cloud env / .env on dev machines), never in VITE_*.

export function paystackSecretKey(): string {
  const k = process.env["PAYSTACK_SECRET_KEY"];
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not configured yet.");
  return k;
}

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    channel?: string;
    paid_at?: string | null;
  };
};

/** Verify a Paystack transaction reference server-side. */
export async function paystackVerify(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${paystackSecretKey()}` },
  });
  const body = (await res.json()) as PaystackVerifyResponse;
  if (!res.ok) {
    throw new Error(body.message || `Paystack verify failed with ${res.status}`);
  }
  return body;
}
