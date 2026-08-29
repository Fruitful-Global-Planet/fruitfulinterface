import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Info,
  Plus,
  ScanBarcode,
  Search,
  SearchX,
  ShoppingBasket,
  X,
} from "lucide-react";
import { CATEGORIES, PRODUCTS, formatZAR, formatUSD, type CategoryId, type Product } from "@/lib/catalog";
import type { CartLine } from "@/lib/kiosk-store";
import { useKidswear, type KidswearProduct } from "@/lib/kidswear";
import { useSamFoxPrints } from "@/lib/samfox-prints";
import { useGrandPaintings } from "@/lib/grand-paintings";
import { BarcodeLookup } from "./BarcodeLookup";
import { FruitfulLogo, FruitfulWordmark } from "./FruitfulLogo";
import { KidswearDetailScreen } from "./KidswearDetailScreen";
import { KIOSK_SCROLLER_CLASS, useKioskScroll } from "@/lib/kiosk-scroll";


type SortId = "featured" | "price-asc" | "price-desc" | "name" | "newest";

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price low" },
  { id: "price-desc", label: "Price high" },
  { id: "name", label: "Name A-Z" },
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
  const { products: dbPaintings } = useGrandPaintings();

  const baseItems = useMemo<Product[]>(() => {
    if (active === "prints") return dbPrints;
    if (active === "kidswear") return dbKidswear;
    if (active === "paintings") return dbPaintings;
    return PRODUCTS.filter((p) => p.category === active);
  }, [active, dbPrints, dbKidswear, dbPaintings]);

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
    return Array.from(set).slice(0, 18);
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
      case "price-asc":
        arr.sort((a, b) => a.priceZAR - b.priceZAR);
        break;
      case "price-desc":
        arr.sort((a, b) => b.priceZAR - a.priceZAR);
        break;
      case "name":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
        if (isKidswearCat) arr.sort((a, b) => (b as KidswearProduct).row.slot_number - (a as KidswearProduct).row.slot_number);
        break;
      case "featured":
      default:
        arr.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
        break;
    }
    return arr;
  }, [filtered, isKidswearCat, sortBy]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const items = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = isKidswearCat && (query.trim() || tagFilter);
  const activeCat = CATEGORIES.find((c) => c.id === active);
  const inCart = (id: string) => cart.find((l) => l.product.id === id)?.qty ?? 0;

  const { scrollRef, onScroll, headerRef, dockRef, jumpTo } = useKioskScroll({
    key: "browse",
    ready: baseItems.length > 0,
  });



  useEffect(() => {
    setPage(1);
  }, [active, query, tagFilter, sortBy]);

  const jumpTargets = useMemo(
    () => [
      { id: "highlight", label: "Overview" },
      ...(isKidswearCat ? [{ id: "filters", label: "Filters" }] : []),
      { id: "products", label: "Products" },
      ...(pageCount > 1 ? [{ id: "pages", label: "Pages" }] : []),
    ],
    [isKidswearCat, pageCount],
  );

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      data-kiosk-scroller="browse"
      className={KIOSK_SCROLLER_CLASS}
      style={{ backgroundColor: "var(--background)", color: "var(--ink)", WebkitOverflowScrolling: "touch" }}
    >
      <header ref={headerRef} className="sticky top-0 z-30 w-full min-w-0 max-w-full border-b border-border bg-background px-4 pb-3 pt-4">

        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
          <button type="button" onClick={onClose} className="flex min-w-0 items-center gap-2 text-left active:scale-95" aria-label="Home">
            <FruitfulLogo className="h-9 w-9 shrink-0" />
            <FruitfulWordmark className="truncate text-xl" />
          </button>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full active:scale-95"
            style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
            aria-label="Scan barcode"
          >
            <ScanBarcode className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full active:scale-95"
            style={{ backgroundColor: "var(--coral)", color: "var(--coral-foreground)" }}
            aria-label="Return to start"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <p className="font-display text-[10px] font-black uppercase tracking-[0.32em]" style={{ color: "var(--coral)" }}>
            Choose a department
          </p>
          <h1 className="mt-1 truncate font-display text-4xl font-black leading-none" style={{ letterSpacing: "0" }}>
            {activeCat?.label}
          </h1>
        </div>

        <nav className="mt-4 flex w-full min-w-0 max-w-full flex-wrap gap-2" aria-label="Product categories">
          {CATEGORIES.map((c) => {
            const isActive = c.id === active;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className="flex h-14 shrink-0 items-center gap-2 rounded-full px-5 font-display text-sm font-black uppercase tracking-wide active:scale-95"
                style={{
                  backgroundColor: isActive ? "var(--ink)" : "var(--cream)",
                  color: isActive ? "var(--background)" : "var(--ink)",
                }}
              >
                {c.label}
              </button>
            );
          })}
        </nav>

        <nav className="mt-3 flex w-full min-w-0 max-w-full flex-wrap gap-2" aria-label="Jump to section">
          {jumpTargets.map((t) => (
            <button
              key={t.id}
              type="button"
              data-jump={t.id}
              onClick={() => jumpTo(t.id)}
              className="h-9 shrink-0 rounded-full px-3 font-display text-[11px] font-black uppercase tracking-[0.18em] active:scale-95"
              style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main
        className="w-full min-w-0 max-w-full px-4 pt-4"
        style={{ paddingBottom: "1.5rem" }}
      >
        <section
          data-kiosk-section="highlight"
          className="mb-4 w-full min-w-0 overflow-hidden rounded-[28px]"
          style={{ backgroundColor: "var(--mint)", boxShadow: "0 18px 40px rgba(0,0,0,0.08)" }}
        >

          <div className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-3 p-4">
            <div className="min-w-0">
              <p className="font-display text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: "color-mix(in oklab, var(--ink) 65%, transparent)" }}>
                Fruitful selection
              </p>
              <h2 className="mt-1 font-display text-2xl font-black leading-none" style={{ letterSpacing: "0" }}>
                {sorted.length} pieces ready
              </h2>
              <p className="mt-2 line-clamp-2 text-sm font-bold leading-tight" style={{ color: "color-mix(in oklab, var(--ink) 72%, transparent)" }}>
                Tap a product for detail, add to basket, then check out from the fixed bar below.
              </p>
            </div>
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-card">
              <FruitfulLogo className="h-16 w-16" />
            </div>
          </div>
        </section>

        {isKidswearCat && (
          <section data-kiosk-section="filters" className="mb-4 w-full min-w-0 space-y-3 rounded-[28px] bg-card p-3 shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search code, barcode, fabric..."
                className="h-14 w-full rounded-full border border-border bg-background py-3 pl-12 pr-12 text-base font-bold outline-none focus:border-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full active:scale-95"
                  style={{ backgroundColor: "var(--cream)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {kidswearTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  className="h-10 shrink-0 rounded-full px-4 font-display text-xs font-black uppercase tracking-wider active:scale-95"
                  style={{ backgroundColor: tagFilter === null ? "var(--coral)" : "var(--cream)", color: tagFilter === null ? "var(--coral-foreground)" : "var(--ink)" }}
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
                      className="h-10 shrink-0 rounded-full px-4 font-display text-xs font-black uppercase tracking-wider active:scale-95"
                      style={{ backgroundColor: isActive ? "var(--coral)" : "var(--cream)", color: isActive ? "var(--coral-foreground)" : "var(--ink)" }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section className="mb-4 grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <label className="flex min-w-0 items-center gap-2 rounded-full bg-card px-4 py-3">
            <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 font-display text-xs font-black uppercase tracking-wider text-muted-foreground">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortId)}
              className="min-w-0 flex-1 bg-transparent font-display text-sm font-black outline-none"
              style={{ color: "var(--ink)" }}
            >
              {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <div className="rounded-full px-4 py-3 font-display text-xs font-black uppercase tracking-wider" style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}>
            {sorted.length} items
          </div>
        </section>

        {items.length === 0 ? (
          <section data-kiosk-section="products" className="mt-8 flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-border bg-card px-6 py-10 text-center">
            <SearchX className="h-10 w-10" style={{ color: "var(--coral)" }} />
            <h3 className="font-display text-xl font-black" style={{ color: "var(--ink)" }}>
              No match {query.trim() ? `for “${query.trim()}”` : "for these filters"}
            </h3>
            <p className="max-w-xs text-sm font-semibold text-muted-foreground">Try another item code, barcode, size, or fabric.</p>
            {activeFilters && (
              <button
                type="button"
                onClick={() => { setQuery(""); setTagFilter(null); }}
                className="h-12 rounded-full px-5 font-display text-xs font-black uppercase tracking-widest active:scale-95"
                style={{ backgroundColor: "var(--coral)", color: "var(--coral-foreground)" }}
              >
                Clear filters
              </button>
            )}
          </section>
        ) : (
          <section data-kiosk-section="products" className="grid w-full min-w-0 grid-cols-2 gap-3">
            {items.map((p) => {
              const qty = inCart(p.id);
              const soldOut = p.stock - qty <= 0;
              const isKidswear = active === "kidswear";
              const isSub = p.pricingModel === "subscription";
              return (
                <article key={p.id} className="min-w-0 overflow-hidden rounded-[28px] bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => isKidswear && setDetail(p as KidswearProduct)}
                    className="relative block aspect-[1/1.08] w-full overflow-hidden text-left active:scale-[0.99]"
                    style={{ backgroundColor: "var(--cream)" }}
                    aria-label={isKidswear ? `View ${p.name}` : p.name}
                  >
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" draggable={false} />
                    <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.72))" }}>
                      <div className="inline-flex items-baseline gap-1 rounded-full px-3 py-1 font-display text-sm font-black" style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}>
                        {formatZAR(isSub ? (p.subscriptionZAR ?? p.priceZAR) : p.priceZAR)}
                        {isSub && <span className="text-[10px]">/mo</span>}
                      </div>
                    </div>
                    {p.featured && (
                      <span className="absolute left-2 top-2 rounded-full px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: "var(--coral)", color: "var(--coral-foreground)" }}>
                        Featured
                      </span>
                    )}
                    {isKidswear && !soldOut && (
                      <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card shadow-sm" style={{ color: "var(--ink)" }}>
                        <Info className="h-4 w-4" />
                      </span>
                    )}
                    {soldOut && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.66)" }}>
                        <span className="rounded-full bg-card px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider">Sold out</span>
                      </div>
                    )}
                  </button>
                  <div className="p-3">
                    <h3 className="line-clamp-2 min-h-[38px] font-display text-[15px] font-black leading-tight" style={{ color: "var(--ink)", letterSpacing: "0" }}>
                      {p.name}
                    </h3>
                    <div className="mt-1 truncate text-xs font-bold text-muted-foreground">
                      {isKidswear ? "Incl VAT" : isSub ? "Subscription · monthly" : formatUSD(p.priceUSD)} · {p.artisanName}
                    </div>
                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() => onAdd(p)}
                      className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full font-display text-sm font-black uppercase tracking-wider disabled:opacity-35 active:scale-95"
                      style={{ backgroundColor: qty > 0 ? "var(--mint)" : "var(--coral)", color: qty > 0 ? "var(--ink)" : "var(--coral-foreground)" }}
                      aria-label={`Add ${p.name}`}
                    >
                      {qty > 0 ? <><Check className="h-4 w-4" /> {qty} {isSub ? "subscribed" : "added"}</> : <><Plus className="h-4 w-4" /> {isSub ? "Subscribe" : "Add"}</>}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {pageCount > 1 && (
          <section data-kiosk-section="pages" className="mt-6 flex w-full min-w-0 items-center justify-center gap-3">
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid h-13 w-13 place-items-center rounded-full bg-card disabled:opacity-30 active:scale-95"
              style={{ color: "var(--ink)" }}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="rounded-full px-5 py-3 font-display text-sm font-black uppercase tracking-wider" style={{ backgroundColor: "var(--cream)", color: "var(--ink)" }}>
              Page {safePage} / {pageCount}
            </div>
            <button
              type="button"
              disabled={safePage === pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="grid h-13 w-13 place-items-center rounded-full disabled:opacity-30 active:scale-95"
              style={{ backgroundColor: "var(--coral)", color: "var(--coral-foreground)" }}
              aria-label="Next page"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </section>
        )}
      </main>

      <button
        ref={(el) => { dockRef.current = el; }}
        type="button"
        onClick={onOpenCart}
        disabled={itemCount === 0}
        className="sticky bottom-0 z-20 m-3 grid h-[76px] min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[28px] px-4 font-display font-black shadow-xl disabled:opacity-60 active:scale-[0.99]"
        style={{ backgroundColor: "var(--ink)", color: "var(--background)", width: "calc(100% - 1.5rem)" }}
      >
        <span className="relative grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: "var(--coral)", color: "var(--coral-foreground)" }}>
          <ShoppingBasket className="h-6 w-6" />
          {itemCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full text-xs" style={{ backgroundColor: "var(--sun)", color: "var(--ink)" }}>
              {itemCount}
            </span>
          )}
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[10px] uppercase tracking-[0.28em] opacity-70">Basket total</span>
          <span className="mt-1 block truncate text-2xl leading-none">{formatZAR(total)}</span>
        </span>
        <span className="rounded-full px-4 py-3 text-xs uppercase tracking-widest" style={{ backgroundColor: itemCount > 0 ? "var(--coral)" : "color-mix(in oklab, white 12%, transparent)", color: itemCount > 0 ? "var(--coral-foreground)" : "var(--background)" }}>
          {itemCount > 0 ? "Checkout" : "Empty"}
        </span>
      </button>

      {detail && <KidswearDetailScreen product={detail} inCart={inCart(detail.id)} onAdd={() => onAdd(detail)} onClose={() => setDetail(null)} />}

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