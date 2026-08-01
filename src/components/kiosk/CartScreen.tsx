import { formatZAR } from "@/lib/catalog";
import type { CartLine } from "@/lib/kiosk-store";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { KIOSK_SCROLLER_CLASS, useKioskScroll } from "@/lib/kiosk-scroll";

type Props = {
  cart: CartLine[];
  total: number;
  onBack: () => void;
  onAdd: (p: CartLine["product"]) => void;
  onDecrement: (cartId: string) => void;
  onRemove: (cartId: string) => void;
  onCheckout: () => void;
};

export function CartScreen({ cart, total, onBack, onAdd, onDecrement, onRemove, onCheckout }: Props) {
  const { scrollRef, headerRef, dockRef } = useKioskScroll({ key: "cart" });

  return (
    <div
      ref={scrollRef}
      data-kiosk-scroller="cart"
      className={KIOSK_SCROLLER_CLASS}
      style={{ backgroundColor: "var(--background)", WebkitOverflowScrolling: "touch" }}
    >
      <header
        ref={headerRef}
        className="sticky top-0 z-30 flex items-center justify-between px-5 pb-4 pt-5"
        style={{ backgroundColor: "var(--mint)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-full bg-white px-4 font-display text-sm font-bold transition-transform active:scale-95"
          style={{ color: "var(--ink)" }}
        >
          <ArrowLeft className="h-5 w-5" />
          Continue
        </button>
        <h2 className="font-display text-xl font-bold text-white">Your Basket</h2>
        <div className="w-[88px]" />
      </header>

      <main className="px-4 pt-4" style={{ paddingBottom: "1.5rem" }}>
        {cart.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
            <p className="font-display text-2xl font-bold" style={{ color: "var(--ink)" }}>
              Your basket is empty.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap “Continue” to browse the artisans.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((line) => (
              <li
                key={line.cartId}
                className="flex items-center gap-3 rounded-3xl bg-card p-3"
                style={{ border: "1px solid var(--border)" }}
              >
                <img
                  src={line.product.imageUrl}
                  alt={line.product.name}
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                  style={{ backgroundColor: "var(--cream)" }}
                  draggable={false}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold leading-tight" style={{ color: "var(--ink)" }}>
                    {line.product.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {line.product.artisanName} · {line.product.artisanLocation}
                  </p>
                  <p className="mt-1 font-display text-base font-bold" style={{ color: "var(--coral)" }}>
                    {formatZAR(line.product.priceZAR * line.qty)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className="flex items-center gap-2 rounded-2xl p-1"
                    style={{ backgroundColor: "var(--secondary)" }}
                  >
                    <button
                      type="button"
                      onClick={() => onDecrement(line.cartId)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white transition-transform active:scale-90"
                      aria-label="Decrease"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center font-display text-base font-bold">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => onAdd(line.product)}
                      disabled={line.qty >= line.product.stock}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition-transform active:scale-90 disabled:opacity-30"
                      style={{ backgroundColor: "var(--coral)" }}
                      aria-label="Increase"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(line.cartId)}
                    className="flex h-8 items-center gap-1 px-2 text-[11px] font-semibold text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* Checkout dock */}
      {cart.length > 0 && (
        <div
          ref={(el) => { dockRef.current = el; }}
          className="sticky bottom-0 left-0 right-0 z-20 mx-auto w-full max-w-[480px] px-4 pb-5 pt-3"
          style={{
            background: "linear-gradient(to top, var(--background) 70%, transparent)",
          }}
        >
          <div className="mb-3 flex items-baseline justify-between px-2">
            <span className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Total
            </span>
            <span className="font-display text-3xl font-bold" style={{ color: "var(--ink)" }}>
              {formatZAR(total)}
            </span>
          </div>
          <button
            type="button"
            onClick={onCheckout}
            className="flex h-16 w-full items-center justify-center rounded-full font-display text-lg font-bold uppercase tracking-widest text-white transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: "var(--coral)",
              boxShadow: "0 20px 40px -12px rgba(230,57,70,0.55)",
            }}
          >
            Pay at kiosk
          </button>
        </div>
      )}
    </div>
  );
}
