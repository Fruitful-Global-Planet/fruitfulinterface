/**
 * Grand Paintings — Grand Machadlela one-of-one canvases.
 * v1.6: kiosk range wired from the `grand_paintings` Supabase table.
 * Mirrors `samfox-prints.ts`: published-only, slot-ordered, art is subscription.
 * Product ids use the `gp-` prefix so the `place_order` RPC can decrement stock.
 */

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./catalog";

export type GrandPaintingRow = {
  id: string;
  slot_number: number;
  image_url: string;
  name: string;
  description: string;
  price_zar_cents: number;
  price_usd_cents: number;
  stock: number;
  is_published: boolean;
  item_code?: string | null;
  sku?: string | null;
  pricing_model?: string | null;
  subscription_zar_cents?: number | null;
};

/** Monthly subscription rate = 10% of list, rounded to the nearest R5 (same rule as SamFox). */
const SUBSCRIPTION_RATE = (cents: number) => Math.round((cents * 0.1) / 500) * 500;

export function rowToProduct(row: GrandPaintingRow): Product {
  return {
    id: `gp-${row.id}`,
    sku: row.sku ?? `GRM-PAINT-${String(row.slot_number).padStart(3, "0")}`,
    category: "paintings",
    name: row.name?.trim() || `Grand Painting ${row.slot_number}`,
    description: row.description || "One-of-one hand-painted canvas by Grand Machadlela.",
    priceZAR: row.price_zar_cents,
    priceUSD: row.price_usd_cents,
    imageUrl: row.image_url,
    artisanName: "Grand Machadlela",
    artisanLocation: "Mamelodi, SA",
    stock: row.stock,
    // Art is collected by subscription, never an outright sale.
    pricingModel: row.pricing_model === "one-time" ? "one-time" : "subscription",
    subscriptionZAR: row.subscription_zar_cents ?? SUBSCRIPTION_RATE(row.price_zar_cents),
  };
}

/**
 * Local one-of-one fallback — the 11 Grand canvases shipped in the repo asset
 * manifest (`src/assets/grand/*.asset.json`). Shown when the Supabase fetch
 * fails; deduped by name so these disappear once the DB rows arrive.
 */
const grandManifests = import.meta.glob("@/assets/grand/*.asset.json", { eager: true }) as Record<
  string,
  { url?: string }
>;

const LOCAL_PAINTINGS: Product[] = Object.entries(grandManifests)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod], i) => {
    const url = mod?.url;
    const slot = i + 1;
    return {
      id: `gp-local-${slot}`,
      sku: `GRM-PAINT-${String(slot).padStart(3, "0")}`,
      category: "paintings" as const,
      name: `Grand Painting ${slot}`,
      description: "One-of-one hand-painted canvas by Grand Machadlela. No two alike.",
      priceZAR: 245000,
      priceUSD: 16000,
      imageUrl: url ?? "",
      artisanName: "Grand Machadlela",
      artisanLocation: "Mamelodi, SA",
      stock: 1,
      featured: slot === 1,
      pricingModel: "subscription" as const,
      subscriptionZAR: 24500,
    };
  });

export function useGrandPaintings() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("grand_paintings")
        .select("*")
        .eq("is_published", true)
        .order("slot_number", { ascending: true });
      if (!alive) return;
      if (!error && data) {
        const merged = [...data.map((r) => rowToProduct(r as GrandPaintingRow))];
        for (const art of LOCAL_PAINTINGS) {
          if (!merged.some((p) => p.name === art.name)) merged.push(art);
        }
        setProducts(merged);
      } else {
        setProducts(LOCAL_PAINTINGS);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}
