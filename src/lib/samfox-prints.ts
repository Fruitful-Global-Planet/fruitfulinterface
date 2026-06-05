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
};

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
  };
}

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
      if (!error && data) setProducts(data.map((r) => rowToProduct(r as SamFoxPrintRow)));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}
