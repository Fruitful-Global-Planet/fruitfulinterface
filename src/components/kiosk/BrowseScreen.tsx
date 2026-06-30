import { useState, useMemo } from "react";
import { CATEGORIES, PRODUCTS, formatZAR, formatUSD, type CategoryId, type Product } from "@/lib/catalog";
import { FruitfulLogo, FruitfulWordmark } from "./FruitfulLogo";
import { ShoppingBasket, Plus, Check, MapPin, Info } from "lucide-react";
import type { CartLine } from "@/lib/kiosk-store";
import { useSamFoxPrints } from "@/lib/samfox-prints";
import { useKidswear, type KidswearProduct } from "@/lib/kidswear";
import { KidswearDetailScreen } from "./KidswearDetailScreen";
import { ROTATING_BANNERS } from "@/lib/banners";

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
  const { products: dbPrints } = useSamFoxPrints();
  const { products: dbKidswear } = useKidswear();

  const items = useMemo<Product[]>(() => {
    if (active === "prints") return dbPrints;
    if (active === "kidswear") return dbKidswear;
    return PRODUCTS.filter((p) => p.category === active);
  }, [active, dbPrints, dbKidswear]);

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
        <div className="text-right">
          <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
            Node · Silverton
          </p>
          <p className="font-display text-xs font-bold text-white">
            Support Local Artisans
          </p>
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

      {/* Product grid */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
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
    </div>
  );
}
