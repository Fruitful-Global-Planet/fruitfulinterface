import { useState, useMemo, useEffect } from "react";
import { CATEGORIES, PRODUCTS, formatZAR, formatUSD, type CategoryId, type Product } from "@/lib/catalog";
import { FruitfulLogo, FruitfulWordmark } from "./FruitfulLogo";
import { ShoppingBasket, Plus, Check, MapPin, Info, Search, ScanBarcode, X, ArrowUpDown, ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import type { CartLine } from "@/lib/kiosk-store";
import { useSamFoxPrints } from "@/lib/samfox-prints";
import { useKidswear, type KidswearProduct } from "@/lib/kidswear";
import { KidswearDetailScreen } from "./KidswearDetailScreen";
import { BarcodeLookup } from "./BarcodeLookup";
import { ROTATING_BANNERS } from "@/lib/banners";

type SortId = "featured" | "price-asc" | "price-desc" | "name" | "newest";
const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price ↑" },
  { id: "price-desc", label: "Price ↓" },
  { id: "name", label: "Name A–Z" },
];
const PAGE_SIZE = 8;

type Props = {
  cart: CartLine[];
  itemCount: number;
  total: number;
  onAdd: (p: Product) => void;
  onOpenCart: () => void;
  onClose: () => void;
};

export function BrowseScreen({ cart, itemCount, total, onAdd, onOpenCart, onClose }: Props) {
  const [active, setActive] = useState<CategoryId>("kidswear");
  const [detail, setDetail] = useState<KidswearProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortId>("featured");
  const [page, setPage] = useState(1);
  const { products: dbPrints } = useSamFoxPrints();
  const { products: dbKidswear } = useKidswear();

  const baseItems = useMemo<Product[]>(() => {
    if (active === "prints") return dbPrints;
    if (active === "kidswear") return dbKidswear;
    return PRODUCTS.filter((p) => p.category === active);
  }, [active, dbPrints, dbKidswear]);

  const isKidswearCat = active === "kidswear";

  const kidswearTags = useMemo(() => {
    if (!isKidswearCat) return [] as string[];
    const set = new Set<string>();
    for (const p of dbKidswear) {
      const r = p.row;
      [r.age_range, r.size_label, r.fabric, r.gender, r.color]
        .filter(Boolean)
        .forEach((t) => set.add(t as string));
      (r.tags ?? []).forEach((t) => t && set.add(t));
    }
    return Array.from(set).slice(0, 20);
  }, [dbKidswear, isKidswearCat]);

  const filtered = useMemo<Product[]>(() => {
    if (!isKidswearCat) return baseItems;
    const q = query.trim().toLowerCase();
    return (baseItems as KidswearProduct[]).filter((p) => {
      const r = p.row;
      if (tagFilter) {
        const haystack = [r.age_range, r.size_label, r.fabric, r.gender, r.color, ...(r.tags ?? [])]
          .filter(Boolean)
          .map((s) => (s as string).toLowerCase());
        if (!haystack.includes(tagFilter.toLowerCase())) return false;
      }
      if (!q) return true;
      const fields = [p.name, r.item_code, r.sku, r.barcode, r.description, r.fabric, r.age_range, r.size_label, r.color]
        .filter(Boolean)
        .map((s) => (s as string).toLowerCase());
      return fields.some((f) => f.includes(q));
    });
  }, [baseItems, isKidswearCat, query, tagFilter]);

  const sorted = useMemo<Product[]>(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "price-asc": arr.sort((a, b) => a.priceZAR - b.priceZAR); break;
      case "price-desc": arr.sort((a, b) => b.priceZAR - a.priceZAR); break;
      case "name": arr.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "newest":
        if (isKidswearCat) {
          arr.sort((a, b) => (b as KidswearProduct).row.slot_number - (a as KidswearProduct).row.slot_number);
        }
        break;
      case "featured":
      default:
        arr.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
        break;
    }
    return arr;
  }, [filtered, sortBy, isKidswearCat]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const items = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  useEffect(() => { setPage(1); }, [active, query, tagFilter, sortBy]);

  const activeFilters = isKidswearCat && (query.trim() || tagFilter);

  const inCart = (id: string) => cart.find((l) => l.product.id === id)?.qty ?? 0;

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* Header */}
      <header
        className="relative flex items-center justify-between px-5 pb-3 pt-5"
        style={{ backgroundColor: "var(--mint)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 font-display text-sm font-bold"
          style={{ color: "var(--ink)" }}
        >
          <FruitfulLogo className="h-7 w-7" />
          <FruitfulWordmark className="text-base" />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 font-display text-xs font-bold"
            style={{ color: "var(--ink)" }}
            aria-label="Scan or enter barcode"
          >
            <ScanBarcode className="h-4 w-4" style={{ color: "var(--coral)" }} />
            Scan
          </button>
          <div className="text-right">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
              Node · Silverton
            </p>
            <p className="font-display text-xs font-bold text-white">
              Support Local Artisans
            </p>
          </div>
        </div>
      </header>

      {/* Banner strip */}
      <div
        className="flex shrink-0 gap-3 overflow-x-auto px-4 py-3"
        style={{ backgroundColor: "var(--mint)", scrollbarWidth: "none" }}
      >
        {ROTATING_BANNERS.map((b) => (
          <div
            key={b.src}
            className="relative h-24 w-64 shrink-0 overflow-hidden rounded-2xl shadow-md"
            style={{ backgroundColor: "var(--cream)" }}
          >
            <img src={b.src} alt={b.title} className="h-full w-full object-cover" loading="lazy" draggable={false} />
            <div
              className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-[10px] font-bold text-white"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}
            >
              <p className="font-display uppercase tracking-widest">{b.title}</p>
              <p className="truncate opacity-90">{b.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category strip */}
      <nav
        className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3"
        style={{ backgroundColor: "var(--mint)", scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className="flex shrink-0 items-center gap-2 rounded-full px-4 py-3 font-display text-sm font-bold transition-transform active:scale-95"
              style={{
                backgroundColor: isActive ? "var(--coral)" : "white",
                color: isActive ? "white" : "var(--ink)",
                boxShadow: isActive ? "0 8px 20px -8px rgba(230,57,70,0.55)" : undefined,
              }}
            >
              <span aria-hidden>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Kidswear search + filter */}
      {isKidswearCat && (
        <div className="shrink-0 space-y-2 border-b border-border bg-background px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by item code, name, fabric…"
              className="w-full rounded-full border border-border bg-secondary/60 pl-9 pr-9 py-2.5 text-sm outline-none focus:border-[var(--coral)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-background"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {kidswearTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button
                type="button"
                onClick={() => setTagFilter(null)}
                className="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  backgroundColor: tagFilter === null ? "var(--ink)" : "var(--secondary, #eee)",
                  color: tagFilter === null ? "white" : "var(--ink)",
                }}
              >
                All
              </button>
              {kidswearTags.map((t) => {
                const isActive = tagFilter === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTagFilter(isActive ? null : t)}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize"
                    style={{
                      backgroundColor: isActive ? "var(--coral)" : "var(--secondary, #eee)",
                      color: isActive ? "white" : "var(--ink)",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="font-display font-bold uppercase tracking-widest">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortId)}
                className="rounded-md border border-border bg-background px-2 py-1 font-display text-xs font-bold"
                style={{ color: "var(--ink)" }}
              >
                {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <span className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {sorted.length} {sorted.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      )}

      {/* Product grid */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <SearchX className="h-10 w-10" style={{ color: "var(--coral)" }} />
            <h3 className="font-display text-lg font-bold" style={{ color: "var(--ink)" }}>
              No Kidswear match {query.trim() ? `"${query.trim()}"` : "these filters"}
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              {tagFilter
                ? `Try removing the "${tagFilter}" tag or clearing your search.`
                : "Try a different item code, size, or fabric — or clear the search to see everything."}
            </p>
            {activeFilters && (
              <button
                type="button"
                onClick={() => { setQuery(""); setTagFilter(null); }}
                className="rounded-full px-4 py-2 font-display text-xs font-bold text-white"
                style={{ backgroundColor: "var(--coral)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => {
            const qty = inCart(p.id);
            const soldOut = p.stock - qty <= 0;
            const isKidswear = active === "kidswear";
            return (
              <article
                key={p.id}
                className="overflow-hidden rounded-3xl bg-card shadow-sm"
                style={{ border: "1px solid var(--border)" }}
              >
                <button
                  type="button"
                  onClick={() => isKidswear && setDetail(p as KidswearProduct)}
                  className="relative block aspect-square w-full overflow-hidden text-left"
                  style={{ backgroundColor: "var(--cream)" }}
                  aria-label={isKidswear ? `View details for ${p.name}` : p.name}
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                  {p.featured && (
                    <span
                      className="absolute left-2 top-2 rounded-full px-2 py-1 font-display text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
                    >
                      Featured
                    </span>
                  )}
                  {isKidswear && (
                    <span
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow"
                      style={{ color: "var(--ink)" }}
                    >
                      <Info className="h-4 w-4" />
                    </span>
                  )}
                  {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <span className="rounded-full bg-white px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider">
                        Sold out
                      </span>
                    </div>
                  )}
                </button>
                <div className="p-3">
                  <h3 className="font-display text-sm font-bold leading-tight line-clamp-2" style={{ color: "var(--ink)" }}>
                    {p.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--coral)" }} />
                    <span className="truncate">
                      {p.artisanName} · {p.artisanLocation}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <p className="font-display text-lg font-bold leading-none" style={{ color: "var(--ink)" }}>
                        {formatZAR(p.priceZAR)}
                      </p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {isKidswear ? "incl. 15% VAT" : `${formatUSD(p.priceUSD)} USD`}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() => onAdd(p)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-white transition-transform active:scale-90 disabled:opacity-30"
                      style={{
                        backgroundColor: qty > 0 ? "var(--mint-deep, var(--mint))" : "var(--coral)",
                      }}
                      aria-label={`Add ${p.name} to basket`}
                    >
                      {qty > 0 ? (
                        <span className="flex items-center font-display text-sm font-bold">
                          <Check className="mr-0.5 h-3.5 w-3.5" />
                          {qty}
                        </span>
                      ) : (
                        <Plus className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {isKidswearCat && pageCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card font-display disabled:opacity-30"
              style={{ border: "1px solid var(--border)", color: "var(--ink)" }}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-display text-sm font-bold" style={{ color: "var(--ink)" }}>
              Page {safePage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full font-display text-white disabled:opacity-30"
              style={{ backgroundColor: "var(--coral)" }}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Brand footer */}
        <div className="mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Crafted in South Africa · Made in the bush
        </div>
      </main>


      {/* Persistent basket bar */}
      <button
        type="button"
        onClick={onOpenCart}
        disabled={itemCount === 0}
        className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[480px] items-center justify-between px-5 py-4 font-display font-bold transition-all disabled:opacity-50"
        style={{
          backgroundColor: "var(--ink)",
          color: "white",
          boxShadow: "0 -20px 40px -20px rgba(0,0,0,0.4)",
        }}
      >
        <span className="flex items-center gap-3 text-base">
          <span
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--coral)" }}
          >
            <ShoppingBasket className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
              >
                {itemCount}
              </span>
            )}
          </span>
          <span className="text-lg">{formatZAR(total)}</span>
        </span>
        <span className="flex items-center gap-2 rounded-full px-5 py-2 text-sm uppercase tracking-widest" style={{ backgroundColor: itemCount > 0 ? "var(--coral)" : "transparent" }}>
          {itemCount > 0 ? "Review basket" : "Basket empty"}
        </span>
      </button>

      {/* Kidswear detail overlay */}
      {detail && (
        <KidswearDetailScreen
          product={detail}
          inCart={inCart(detail.id)}
          onAdd={() => onAdd(detail)}
          onClose={() => setDetail(null)}
        />
      )}

      {scannerOpen && (
        <BarcodeLookup
          onClose={() => setScannerOpen(false)}
          onFound={(p) => {
            setScannerOpen(false);
            setActive("kidswear");
            setDetail(p);
          }}
        />
      )}
    </div>
  );
}
