/**
 * Order persistence for the Fruitful kiosk.
 *
 * After a successful payment the kiosk calls the `place_order` RPC, which
 * inserts the order (idempotent on order_ref) and atomically decrements stock
 * for DB-backed products (bashedi_kidswear / samfox_prints).
 *
 * Record failures are non-fatal by design: the shopper already paid, so the
 * kiosk still shows the success screen and surfaces a toast for staff.
 */

import { supabase } from "@/integrations/supabase/client";
import type { CartLine } from "./kiosk-store";

export type OrderLineJson = {
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
};

// Minimal typed surface for the `place_order` RPC (auto-generated Database
// types will include it after the migration is applied + types regenerated).
type OrdersRpc = {
  rpc: (
    fn: "place_order",
    args: {
      p_order_ref: string;
      p_currency: string;
      p_total_cents: number;
      p_payment_provider: string;
      p_payment_reference: string | null;
      p_lines: OrderLineJson[];
    },
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export function cartToOrderLines(cart: CartLine[]): OrderLineJson[] {
  return cart.map((l) => {
    const row = (l.product as { row?: { barcode?: string | null } }).row;
    return {
      productId: l.product.id,
      name: l.product.name,
      sku: l.product.sku ?? null,
      barcode: row?.barcode ?? null,
      unitPriceCents: l.product.priceZAR,
      qty: l.qty,
      lineTotalCents: l.product.priceZAR * l.qty,
    };
  });
}

export async function recordOrder(opts: {
  orderRef: string;
  totalCents: number;
  paymentReference: string | null;
  provider?: "paystack" | "demo";
  lines: OrderLineJson[];
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await (supabase as unknown as OrdersRpc).rpc("place_order", {
      p_order_ref: opts.orderRef,
      p_currency: "ZAR",
      p_total_cents: opts.totalCents,
      p_payment_provider: opts.provider ?? "paystack",
      p_payment_reference: opts.paymentReference,
      p_lines: opts.lines,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: Boolean(data) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
