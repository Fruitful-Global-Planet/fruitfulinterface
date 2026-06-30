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
  size_label: string;
  age_range: string;
  fabric: string;
  color: string;
  price_zar_cents: number;
  price_usd_cents: number;
  stock: number;
  is_published: boolean;
  brand: string;
};

export function rowToProduct(row: KidswearRow): Product {
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
  };
}

export function useKidswear() {
  const [products, setProducts] = useState<Product[]>([]);
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
