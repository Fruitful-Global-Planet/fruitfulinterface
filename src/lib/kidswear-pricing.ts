/**
 * Bashedi Kidswear pricing model.
 *
 *   Selling price (excl VAT) = round(cost_excl_vat × markup)        // markup defaults to 3.5
 *   Selling price (incl VAT) = round(price_excl_vat × (1 + vat))    // vat defaults to 0.15
 *
 * All values are in ZAR cents to avoid floating-point drift.
 */

export const DEFAULT_MARKUP = 3.5;
export const DEFAULT_VAT = 0.15;

export type PricingBreakdown = {
  costExclCents: number;
  markup: number;
  vatRate: number;
  priceExclVatCents: number;
  vatAmountCents: number;
  priceInclVatCents: number;
};

export function computeKidswearPrice(
  costExclVatCents: number,
  markup: number = DEFAULT_MARKUP,
  vatRate: number = DEFAULT_VAT,
): PricingBreakdown {
  const priceExclVatCents = Math.round(costExclVatCents * markup);
  const priceInclVatCents = Math.round(priceExclVatCents * (1 + vatRate));
  return {
    costExclCents: costExclVatCents,
    markup,
    vatRate,
    priceExclVatCents,
    vatAmountCents: priceInclVatCents - priceExclVatCents,
    priceInclVatCents,
  };
}

export const formatRand = (cents: number) =>
  `R ${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
