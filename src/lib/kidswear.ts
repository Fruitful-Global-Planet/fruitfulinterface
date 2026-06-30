import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./catalog";

export type KidswearRow = {
  id: string;
  slot_number: number;
  image_url: string;
  name: string;
  description: string;
  long_description: string;
  item_code: string | null;
  sku: string | null;
  barcode: string | null;
  size_label: string;
  age_range: string;
  fabric: string;
  color: string;
  gender: string;
  cost_price_excl_vat_cents: number;
  markup_multiplier: number;
  vat_rate: number;
  price_zar_cents: number;
  price_usd_cents: number;
  stock: number;
  is_published: boolean;
  brand: string;
  tags: string[];
};

export type KidswearProduct = Product & { row: KidswearRow };

export function rowToProduct(row: KidswearRow): KidswearProduct {
  return {
    id: `ks-${row.id}`,
    sku: row.sku ?? `BASHEDI-KIDS-${String(row.slot_number).padStart(3, "0")}`,
    category: "kidswear",
    name: row.name?.trim() || `Bashedi Kidswear ${row.slot_number}`,
    description:
      row.description ||
      `${row.fabric}${row.age_range ? ` · ${row.age_range}` : ""}`,
    priceZAR: row.price_zar_cents,
    priceUSD: row.price_usd_cents,
    imageUrl: row.image_url,
    artisanName: row.brand || "Bashedi Kidswear",
    artisanLocation: "South Africa",
    stock: row.stock,
    row,
  };
}

export function useKidswear() {
  const [products, setProducts] = useState<KidswearProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("bashedi_kidswear")
        .select("*")
        .eq("is_published", true)
        .order("slot_number", { ascending: true });
      if (!alive) return;
      if (!error && data)
        setProducts(data.map((r) => rowToProduct(r as unknown as KidswearRow)));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}
