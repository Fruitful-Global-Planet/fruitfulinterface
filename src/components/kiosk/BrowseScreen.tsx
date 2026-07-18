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
  const activeCat = CATEGORIES.find((c) => c.id === active);

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: "var(--background)" }}>
      {/* ═══════ HEADER — bold coral slab ═══════ */}
      <header
        className="relative shrink-0 px-5 pb-4 pt-5"
        style={{ backgroundColor: "var(--coral)" }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg active:scale-95"
            aria-label="Home"
          >
            <FruitfulLogo className="h-7 w-7" />
            <FruitfulWordmark className="text-base" />
          </button>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 font-display text-xs font-black uppercase tracking-widest shadow-lg active:scale-95"
            style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
          >
            <ScanBarcode className="h-4 w-4" />
            Scan
          </button>
        </div>
        <div className="mt-4">
          <p className="font-display text-[10px] font-black uppercase tracking-[0.35em] text-white/80">
            Now shopping
          </p>
          <h1 className="font-display text-4xl font-black leading-none text-white" style={{ letterSpacing: "-0.02em" }}>
            {activeCat?.emoji} {activeCat?.label}
          </h1>
        </div>
      </header>

      {/* ═══════ CATEGORY RAIL — big pills ═══════ */}
      <nav
        className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3"
        style={{ backgroundColor: "var(--coral)", scrollbarWidth: "none" }}
      >
        {CATEGORIES.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              className="flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 font-display text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
              style={{
                backgroundColor: isActive ? "white" : "color-mix(in oklab, white 15%, transparent)",
                color: isActive ? "var(--coral)" : "white",
                boxShadow: isActive ? "0 10px 24px -8px rgba(0,0,0,0.35)" : undefined,
              }}
            >
              <span className="text-lg" aria-hidden>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ═══════ Banner strip ═══════ */}
      <div
        className="flex shrink-0 gap-3 overflow-x-auto px-4 py-3"
        style={{ backgroundColor: "var(--mint)", scrollbarWidth: "none" }}
      >
        {ROTATING_BANNERS.map((b) => (
          <div
            key={b.src}
            className="relative h-20 w-56 shrink-0 overflow-hidden rounded-2xl shadow-md"
            style={{ backgroundColor: "var(--cream)" }}
          >
            <img src={b.src} alt={b.title} className="h-full w-full object-cover" loading="lazy" draggable={false} />
            <div
              className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-white"
              style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}
            >
              {b.title}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ Kidswear search + filter ═══════ */}
      {isKidswearCat && (
        <div className="shrink-0 space-y-2 border-b border-border bg-background px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search item code, name, fabric…"
              className="w-full rounded-full border-2 border-border bg-secondary/60 pl-9 pr-9 py-3 text-sm font-semibold outline-none focus:border-[var(--coral)]"
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
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-black uppercase"
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
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-black uppercase"
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
              <span className="font-display font-black uppercase tracking-widest">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortId)}
                className="rounded-md border border-border bg-background px-2 py-1 font-display text-xs font-black"
                style={{ color: "var(--ink)" }}
              >
                {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <span className="font-display text-[11px] font-black uppercase tracking-widest text-muted-foreground">
              {sorted.length} {sorted.length === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      )}

      {/* ═══════ PRODUCT GRID ═══════ */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-36">
        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card px-6 py-10 text-center">
            <SearchX className="h-10 w-10" style={{ color: "var(--coral)" }} />
            <h3 className="font-display text-lg font-black" style={{ color: "var(--ink)" }}>
              No match {query.trim() ? `for "${query.trim()}"` : "for these filters"}
            </h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Try a different item code, size, or fabric.
            </p>
            {activeFilters && (
              <button
                type="button"
                onClick={() => { setQuery(""); setTagFilter(null); }}
                className="rounded-full px-4 py-2 font-display text-xs font-black uppercase tracking-widest text-white"
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
                className="group relative overflow-hidden rounded-3xl bg-card shadow-md transition-transform active:scale-[0.98]"
                style={{ border: "2px solid var(--ink)" }}
              >
                <button
                  type="button"
                  onClick={() => isKidswear && setDetail(p as KidswearProduct)}
                  className="relative block aspect-square w-full overflow-hidden text-left"
                  style={{ backgroundColor: "var(--cream)" }}
                  aria-label={isKidswear ? `View ${p.name}` : p.name}
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
                      className="absolute left-2 top-2 rounded-lg px-2 py-1 font-display text-[10px] font-black uppercase tracking-wider shadow-md"
                      style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
                    >
                      ★ Featured
                    </span>
                  )}
                  {isKidswear && !soldOut && (
                    <span
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md"
                      style={{ color: "var(--ink)" }}
                    >
                      <Info className="h-4 w-4" />
                    </span>
                  )}
                  {soldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/65">
                      <span className="rounded-lg bg-white px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider">
                        Sold out
                      </span>
                    </div>
                  )}

                  {/* Price flag — McDonald's-style yellow */}
                  <div
                    className="absolute -bottom-1 left-3 flex flex-col items-start rounded-lg px-2.5 py-1 shadow-lg"
                    style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
                  >
                    <span className="font-display text-lg font-black leading-none">{formatZAR(p.priceZAR)}</span>
                    <span className="font-display text-[8px] font-black uppercase tracking-widest opacity-80">
                      {isKidswear ? "Incl VAT" : formatUSD(p.priceUSD)}
                    </span>
                  </div>
                </button>
                <div className="p-3 pt-4">
                  <h3 className="font-display text-sm font-black leading-tight line-clamp-2" style={{ color: "var(--ink)" }}>
                    {p.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" style={{ color: "var(--coral)" }} />
                    <span className="truncate">{p.artisanName} · {p.artisanLocation}</span>
                  </div>

                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => onAdd(p)}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-display text-sm font-black uppercase tracking-widest text-white transition-transform active:scale-95 disabled:opacity-30"
                    style={{
                      backgroundColor: qty > 0 ? "var(--mint-deep, var(--mint))" : "var(--coral)",
                      boxShadow: "0 6px 0 rgba(0,0,0,0.15)",
                    }}
                    aria-label={`Add ${p.name}`}
                  >
                    {qty > 0 ? (
                      <>
                        <Check className="h-4 w-4" />
                        In cart · {qty}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card font-display disabled:opacity-30"
              style={{ border: "2px solid var(--ink)", color: "var(--ink)" }}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <span
              className="rounded-2xl px-4 py-3 font-display text-sm font-black uppercase tracking-widest"
              style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
            >
              Page {safePage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-2xl font-display text-white disabled:opacity-30"
              style={{ backgroundColor: "var(--coral)" }}
              aria-label="Next page"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        )}

        <div className="mt-8 text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          Crafted in South Africa · Made in the bush
        </div>
      </main>

      {/* ═══════ PERSISTENT BASKET BAR ═══════ */}
      <button
        type="button"
        onClick={onOpenCart}
        disabled={itemCount === 0}
        className="fixed bottom-0 left-0 right-0 mx-auto flex max-w-[480px] items-center justify-between px-4 py-4 font-display font-black transition-all disabled:opacity-60"
        style={{
          backgroundColor: "var(--ink)",
          color: "white",
          boxShadow: "0 -24px 50px -20px rgba(0,0,0,0.5)",
          borderTop: "3px solid var(--coral)",
        }}
      >
        <span className="flex items-center gap-3">
          <span
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: "var(--coral)" }}
          >
            <ShoppingBasket className="h-6 w-6" />
            {itemCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-md"
                style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}
              >
                {itemCount}
              </span>
            )}
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">Basket</span>
            <span className="mt-1 text-xl">{formatZAR(total)}</span>
          </span>
        </span>
        <span
          className="rounded-2xl px-5 py-3 text-sm uppercase tracking-widest"
          style={{
            backgroundColor: itemCount > 0 ? "var(--coral)" : "transparent",
            border: itemCount > 0 ? undefined : "2px solid rgba(255,255,255,0.2)",
          }}
        >
          {itemCount > 0 ? "Checkout →" : "Empty"}
        </span>
      </button>

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
