// HotStack Nexus — shared types and locked unit economics.

export type NexusItem = {
  id: string;
  item_code: string;
  name: string;
  description: string;
  barcode: string | null;
  profile_length_mm: number;
  carton_qty: number;
  container_config: string;
  cost_price_excl_vat_cents: number;
  logistics_allocation_cents: number;
  selling_price_excl_vat_cents: number;
  vat_rate: number;
  stock: number;
  is_active: boolean;
  sort_order: number;
};

export type ApprovalRequest = {
  id: string;
  ref: string;
  request_type: "credit_limit" | "consignment_restock";
  store_name: string;
  contact_phone: string;
  channel: string;
  amount_zar_cents: number;
  qty: number;
  notes: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  decided_at: string | null;
};

// Locked financial architecture (Aug 2026 model).
export const NEXUS_ECONOMICS = {
  fixedOverheadCents: 7650608, // R76,506.08 / month
  unitCostCents: 75000, // R750 COGS excl VAT
  unitLogisticsCents: 30000, // R300 warehouse/logistics
  unitSellCents: 165000, // R1,650 excl VAT
  get unitVariableCents() {
    return this.unitCostCents + this.unitLogisticsCents;
  },
  get contributionCents() {
    return this.unitSellCents - this.unitVariableCents;
  },
  get breakEvenUnits() {
    return Math.ceil(this.fixedOverheadCents / this.contributionCents);
  },
};

export function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function marginPct(item: NexusItem): number {
  const variable = item.cost_price_excl_vat_cents + item.logistics_allocation_cents;
  if (item.selling_price_excl_vat_cents <= 0) return 0;
  return Math.round(
    ((item.selling_price_excl_vat_cents - variable) / item.selling_price_excl_vat_cents) * 100,
  );
}

export function nextApprovalRef(count: number): string {
  return `AC-${String(count + 1).padStart(4, "0")}`;
}
