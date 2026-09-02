import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Barcode, Package, Search } from "lucide-react";
import { formatRand, marginPct, type NexusItem } from "@/lib/nexus";

export const Route = createFileRoute("/nexus/items")({
  head: () => ({
    meta: [
      { title: "HotStack Nexus · Item Master" },
      {
        name: "description",
        content:
          "ERP-ready EPS cornice item master: EPS01–EPS12 with GS1 barcodes, carton and container configs, and locked unit economics.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ItemMasterPage,
});

type ItemsTable = {
  from: (table: "nexus_items") => {
    select: (columns: "*") => {
      order: (
        column: "sort_order",
        options: { ascending: boolean },
      ) => Promise<{ data: NexusItem[] | null; error: { message: string } | null }>;
    };
  };
};

function ItemMasterPage() {
  const [items, setItems] = useState<NexusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as unknown as ItemsTable)
        .from("nexus_items")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) setError(error.message);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.item_code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        (i.barcode ?? "").includes(q),
    );
  }, [items, query]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black uppercase italic">Item Master</h1>
          <p className="text-sm text-black/60">
            Sage-ready SKU register · 1.5m profile · GS1 barcode allocations
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, name or barcode…"
            className="h-11 w-72 rounded-full border border-black/15 bg-white pl-9 pr-4 text-sm outline-none focus:border-[#0056b3]"
          />
        </div>
      </div>

      {loading && <p className="mt-8 text-sm text-black/50">Loading item master…</p>}
      {error && (
        <p className="mt-8 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          Could not load items: {error}
        </p>
      )}
      {!loading && !error && filtered.length === 0 && (
        <p className="mt-8 rounded-xl bg-white p-6 text-sm text-black/60">
          No items match “{query}”.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const margin = marginPct(item);
          return (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-black/10 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#0056b3]">
                    {item.item_code}
                  </p>
                  <h2 className="font-display text-lg font-black leading-tight">{item.name}</h2>
                </div>
                <span
                  className="rounded-full px-2 py-1 font-display text-[11px] font-black text-white"
                  style={{ backgroundColor: margin >= 35 ? "#28a745" : "#e29a00" }}
                >
                  {margin}% mgn
                </span>
              </div>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-black/65">{item.description}</p>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <dt className="text-black/45">Profile</dt>
                <dd className="text-right font-semibold">{item.profile_length_mm}mm</dd>
                <dt className="text-black/45">Carton</dt>
                <dd className="text-right font-semibold">{item.carton_qty} units</dd>
                <dt className="text-black/45">Container</dt>
                <dd className="text-right font-semibold">{item.container_config}</dd>
                <dt className="text-black/45">Stock</dt>
                <dd className="text-right font-semibold">{item.stock} units</dd>
              </dl>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-black/[0.04] px-3 py-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-black/45">Sell excl. VAT</p>
                  <p className="font-display text-base font-black text-[#28a745]">
                    {formatRand(item.selling_price_excl_vat_cents)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-black/45">Variable cost</p>
                  <p className="font-display text-sm font-bold text-black/70">
                    {formatRand(item.cost_price_excl_vat_cents + item.logistics_allocation_cents)}
                  </p>
                </div>
              </div>

              {item.barcode && (
                <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-black/55">
                  <Barcode className="h-3.5 w-3.5" /> {item.barcode}
                </p>
              )}
            </article>
          );
        })}
      </div>

      {!loading && !error && filtered.length > 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-black/45">
          <Package className="h-3.5 w-3.5" />
          {filtered.length} of {items.length} SKUs · pricing excl. 15% VAT
        </p>
      )}
    </main>
  );
}
