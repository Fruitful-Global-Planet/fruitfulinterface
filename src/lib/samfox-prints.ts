import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./catalog";

export type SamFoxPrintRow = {
  id: string;
  slot_number: number;
  image_url: string;
  name: string;
  description: string;
  price_zar_cents: number;
  price_usd_cents: number;
  stock: number;
  is_published: boolean;
  /** Set by the art-subscriptions migration (defaults to 'subscription' for art). */
  pricing_model?: string | null;
  subscription_zar_cents?: number | null;
};

/** Monthly subscription rate = 10% of list, rounded to the nearest R5. */
const SUBSCRIPTION_RATE = (cents: number) => Math.round((cents * 0.1) / 500) * 500;

export function rowToProduct(row: SamFoxPrintRow): Product {
  return {
    id: `sf-${row.id}`,
    sku: `SF-${String(row.slot_number).padStart(3, "0")}`,
    category: "prints",
    name: row.name?.trim() || `Print ${row.slot_number}`,
    description: row.description || "Original SamFox artwork.",
    priceZAR: row.price_zar_cents,
    priceUSD: row.price_usd_cents,
    imageUrl: row.image_url,
    artisanName: "Sam Fox",
    artisanLocation: "South Africa",
    stock: row.stock,
    // Art is collected by subscription, never an outright sale.
    pricingModel: row.pricing_model === "one-time" ? "one-time" : "subscription",
    subscriptionZAR: row.subscription_zar_cents ?? SUBSCRIPTION_RATE(row.price_zar_cents),
  };
}

// Local one-of-one additions (The Chief + Grand canvas) — shown immediately,
// mirrored in supabase/migrations/20260827150000_art_subscriptions.sql.
// Deduped by name so they disappear here once the migration rows arrive.
const LOCAL_ART: Product[] = [
  {
    id: "p-chief-original",
    sku: "SF-CHIEF-01",
    category: "prints",
    name: "The Chief — Original",
    description:
      "Original Sam Fox illustration — the one-eyed guardian of the bush. One-of-one, hand-finished.",
    priceZAR: 165000,
    priceUSD: 10800,
    imageUrl: "https://sc02.alicdn.com/kf/A5ac67f9e35b642d3a90b437a1f7f5644u.png",
    artisanName: "Sam Fox",
    artisanLocation: "South Africa",
    stock: 3,
    featured: true,
    pricingModel: "subscription",
    subscriptionZAR: 16500,
  },
  {
    id: "p-grand-grant-a",
    sku: "GRAND-001",
    category: "prints",
    name: "Grand — Grant A Canvas",
    description:
      "Hand-painted canvas by Grand Machadlela. One-of-one — no two alike.",
    priceZAR: 245000,
    priceUSD: 16000,
    imageUrl: "https://sc02.alicdn.com/kf/A3a817b8ad35049bdbc11b078ea3c4af3d.png",
    artisanName: "Grand Machadlela",
    artisanLocation: "Mamelodi, SA",
    stock: 2,
    featured: true,
    pricingModel: "subscription",
    subscriptionZAR: 24500,
  },
];

export function useSamFoxPrints() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("samfox_prints")
        .select("*")
        .eq("is_published", true)
        .order("slot_number", { ascending: true });
      if (!alive) return;
      if (!error && data) {
        const merged = [...data.map((r) => rowToProduct(r as SamFoxPrintRow))];
        for (const art of LOCAL_ART) {
          if (!merged.some((p) => p.name === art.name)) merged.push(art);
        }
        setProducts(merged);
      } else {
        setProducts(LOCAL_ART);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}
