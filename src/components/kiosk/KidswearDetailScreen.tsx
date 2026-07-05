import { X, Plus, Check, MapPin, Tag, ScanBarcode, BadgeCheck, Copy } from "lucide-react";
import { toast } from "sonner";
import type { KidswearProduct } from "@/lib/kidswear";
import { computeKidswearPrice, formatRand } from "@/lib/kidswear-pricing";
import { BANNERS } from "@/lib/banners";

type Props = {
  product: KidswearProduct;
  inCart: number;
  onAdd: () => void;
  onClose: () => void;
};

export function KidswearDetailScreen({ product, inCart, onAdd, onClose }: Props) {
  const r = product.row;
  const pricing = computeKidswearPrice(
    r.cost_price_excl_vat_cents,
    r.markup_multiplier,
    r.vat_rate,
  );
  const soldOut = product.stock - inCart <= 0;

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col bg-background">
      {/* Hero image with banner backdrop */}
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${BANNERS.locals})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(8px) brightness(0.55)",
          }}
        />
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={r.image_url}
            alt={product.name}
            className="h-full w-full object-contain"
            draggable={false}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-foreground shadow-lg"
        >
          <X className="h-5 w-5" />
        </button>
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-white shadow"
          style={{ backgroundColor: "var(--coral)" }}
        >
          {r.brand}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 pb-40 pt-5">
        <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: "var(--ink)" }}>
          {product.name}
        </h1>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" style={{ color: "var(--coral)" }} />
          <span>{product.artisanName} · {product.artisanLocation}</span>
        </div>

        {/* Price block */}
        <section
          className="mt-4 rounded-3xl p-4"
          style={{ backgroundColor: "var(--mint)", color: "white" }}
        >
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
            Final price (incl. VAT)
          </p>
          <p className="font-display text-4xl font-bold leading-none">
            {formatRand(pricing.priceInclVatCents)}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold">
            <div className="rounded-xl bg-white/15 px-2 py-2">
              <p className="opacity-75">Cost excl VAT</p>
              <p className="font-display text-sm">{formatRand(pricing.costExclCents)}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-2 py-2">
              <p className="opacity-75">× {pricing.markup} markup</p>
              <p className="font-display text-sm">{formatRand(pricing.priceExclVatCents)}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-2 py-2">
              <p className="opacity-75">+ {Math.round(pricing.vatRate * 100)}% VAT</p>
              <p className="font-display text-sm">{formatRand(pricing.vatAmountCents)}</p>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="mt-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            About this piece
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--ink)" }}>
            {r.long_description || r.description || "Locally hand-made kidswear, crafted with care in South Africa."}
          </p>
        </section>

        {/* Specs */}
        <section className="mt-5 rounded-2xl border border-border bg-card p-4">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="Item code" value={r.item_code} icon={<Tag className="h-4 w-4" />} copyable />
            <Spec label="Barcode" value={r.barcode} icon={<ScanBarcode className="h-4 w-4" />} copyable />
            <Spec label="SKU" value={r.sku} copyable />
            <Spec label="Size" value={r.size_label || "—"} />
            <Spec label="Age range" value={r.age_range || "—"} />
            <Spec label="Fabric" value={r.fabric || "—"} />
            <Spec label="Color" value={r.color || "—"} />
            <Spec label="In stock" value={`${product.stock}`} />
          </dl>
          <button
            type="button"
            onClick={async () => {
              const text = `Item: ${r.item_code ?? "-"}\nBarcode: ${r.barcode ?? "-"}\nSKU: ${r.sku ?? "-"}`;
              try {
                await navigator.clipboard.writeText(text);
                toast.success("Copied item code & barcode");
              } catch {
                toast.error("Copy failed");
              }
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 font-display text-xs font-bold"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy item code & barcode
          </button>
        </section>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs">
          <BadgeCheck className="h-4 w-4" style={{ color: "var(--mint-deep, var(--mint))" }} />
          <span>Proudly Fruitful · Locally hand-made · VAT-inclusive South African pricing</span>
        </div>
      </div>

      {/* Sticky add-to-basket */}
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px] border-t border-border bg-background/95 p-4 backdrop-blur">
        <button
          type="button"
          disabled={soldOut}
          onClick={onAdd}
          className="flex h-16 w-full items-center justify-between rounded-2xl px-5 font-display text-lg font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
          style={{ backgroundColor: soldOut ? "var(--ink)" : "var(--coral)" }}
        >
          <span className="flex items-center gap-2">
            {inCart > 0 ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {soldOut ? "Sold out" : inCart > 0 ? `Added · ${inCart}` : "Add to basket"}
          </span>
          <span>{formatRand(pricing.priceInclVatCents)}</span>
        </button>
      </div>
    </div>
  );
}

function Spec({ label, value, icon, copyable }: { label: string; value: string | null | undefined; icon?: React.ReactNode; copyable?: boolean }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 flex items-center gap-1.5 font-display text-sm font-bold" style={{ color: "var(--ink)" }}>
        <span className="truncate">{value || "—"}</span>
        {copyable && value && (
          <button
            type="button"
            aria-label={`Copy ${label}`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                toast.success(`${label} copied`);
              } catch {
                toast.error("Copy failed");
              }
            }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </dd>
    </div>
  );
}
