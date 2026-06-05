import { useEffect } from "react";
import { formatZAR } from "@/lib/catalog";
import { FruitfulLogo } from "./FruitfulLogo";
import { Check, X } from "lucide-react";

type Props = {
  total: number;
  orderRef: string | null;
  onCancel: () => void;
  onComplete: () => void;
};

export function PayingScreen({ total, orderRef, onCancel, onComplete }: Props) {
  // Phase 1: simulated Paystack overlay. Phase 3 wires the real PaystackPop.setup({...}).
  useEffect(() => {
    const id = window.setTimeout(onComplete, 3500);
    return () => window.clearTimeout(id);
  }, [onComplete]);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-6"
      style={{ backgroundColor: "var(--ink)", color: "white" }}
    >
      <button
        type="button"
        onClick={onCancel}
        className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white"
        aria-label="Cancel"
      >
        <X className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center">
        <div className="relative">
          <div
            className="absolute inset-0 animate-fruitful-pulse rounded-full"
            style={{ backgroundColor: "var(--coral)", filter: "blur(40px)", opacity: 0.5 }}
          />
          <div className="relative rounded-full bg-white p-6">
            <FruitfulLogo className="h-24 w-24 animate-fruitful-bob object-contain" />
          </div>
        </div>
        <h2 className="mt-10 text-center font-display text-3xl font-bold leading-tight">
          Awaiting payment…
        </h2>
        <p className="mt-3 text-center text-base text-white/70">
          Follow the prompts on the card terminal.
        </p>

        <div className="mt-10 w-full max-w-xs space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-4">
            <span className="font-display text-xs font-bold uppercase tracking-widest text-white/60">
              Amount
            </span>
            <span className="font-display text-2xl font-bold text-white">
              {formatZAR(total)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/10 px-5 py-3">
            <span className="font-display text-xs font-bold uppercase tracking-widest text-white/60">
              Reference
            </span>
            <span className="font-mono text-sm font-bold text-white">
              {orderRef ?? "—"}
            </span>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          <span
            className="h-2 w-2 animate-fruitful-pulse rounded-full"
            style={{ backgroundColor: "var(--sun)" }}
          />
          Paystack ZAR · Test mode
        </div>
      </div>
    </div>
  );
}

export function SuccessScreen({
  orderRef,
  total,
  onDone,
}: {
  orderRef: string | null;
  total: number;
  onDone: () => void;
}) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "var(--mint)" }}
    >
      <div
        className="flex h-32 w-32 items-center justify-center rounded-full"
        style={{ backgroundColor: "white", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.25)" }}
      >
        <Check className="h-16 w-16" style={{ color: "var(--coral)", strokeWidth: 3 }} />
      </div>
      <h2 className="mt-8 font-display text-4xl font-bold leading-tight text-white">
        Thank you.
      </h2>
      <p className="mt-3 max-w-xs text-base font-medium text-white/90">
        Your basket will be released at the collection hatch in a moment.
      </p>

      <div
        className="mt-8 w-full max-w-xs rounded-3xl bg-white p-5"
      >
        <p className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Order
        </p>
        <p className="mt-1 font-mono text-lg font-bold" style={{ color: "var(--ink)" }}>
          {orderRef ?? "—"}
        </p>
        <p className="mt-3 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Paid
        </p>
        <p className="font-display text-2xl font-bold" style={{ color: "var(--coral)" }}>
          {formatZAR(total)}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-10 flex h-14 items-center justify-center rounded-full bg-white px-8 font-display text-base font-bold uppercase tracking-widest"
        style={{ color: "var(--coral)" }}
      >
        Done
      </button>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
        Proudly Fruitful
      </p>
    </div>
  );
}
