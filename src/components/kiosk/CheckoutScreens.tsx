import { useEffect, useState } from "react";
import { formatZAR } from "@/lib/catalog";
import { FruitfulLogo } from "./FruitfulLogo";
import { Check, CreditCard, X } from "lucide-react";
import { toast } from "sonner";
import {
  isPaystackConfigured,
  loadPaystackScript,
  paystackCustomerEmail,
  paystackPublicKey,
} from "@/lib/paystack";
import { verifyPayment } from "@/lib/api/paystack.functions";
import { cartToOrderLines, recordOrder } from "@/lib/orders";
import type { CartLine } from "@/lib/kiosk-store";

type Props = {
  total: number;
  orderRef: string | null;
  cart: CartLine[];
  onCancel: () => void;
  onComplete: () => void;
};

export function PayingScreen({ total, orderRef, cart, onCancel, onComplete }: Props) {
  const configured = isPaystackConfigured();
  const [phase, setPhase] = useState<"idle" | "awaiting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Demo fallback: simulate the card-terminal flow when Paystack isn't configured.
  // Orders are still recorded (provider = "demo") so the admin can see test sales.
  useEffect(() => {
    if (configured || phase !== "idle") return;
    const id = window.setTimeout(async () => {
      if (orderRef) {
        const res = await recordOrder({
          orderRef,
          totalCents: total,
          paymentReference: null,
          provider: "demo",
          lines: cartToOrderLines(cart),
        });
        if (!res.ok) toast.warning(`Order recorded locally only: ${res.error}`);
      }
      onComplete();
    }, 3500);
    return () => window.clearTimeout(id);
  }, [configured, phase, orderRef, total, cart, onComplete]);

  async function payWithCard() {
    if (!orderRef) return;
    setPhase("awaiting");
    setErrorMsg(null);
    try {
      await loadPaystackScript();
      const pop = window.PaystackPop;
      if (!pop) throw new Error("Paystack is not available");
      pop
        .setup({
          key: paystackPublicKey()!,
          email: paystackCustomerEmail(),
          amount: total,
          currency: "ZAR",
          ref: orderRef,
          callback: async (response) => {
            // Verify server-side before completing the kiosk flow.
            const ver = await verifyPayment({ data: { reference: response.reference } });
            if (!ver.ok) {
              setErrorMsg(ver.error);
              setPhase("idle");
              return;
            }
            if (!ver.paid) {
              setErrorMsg("Payment not confirmed. Please try again or ask a staff member.");
              setPhase("idle");
              return;
            }
            const rec = await recordOrder({
              orderRef,
              totalCents: total,
              paymentReference: response.reference,
              provider: "paystack",
              lines: cartToOrderLines(cart),
            });
            if (!rec.ok) toast.warning(`Paid, but order record failed: ${rec.error}`);
            onComplete();
          },
          onClose: () => setPhase("idle"),
        })
        .openIframe();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }

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

      <div className="flex w-full max-w-xs flex-col items-center">
        <div className="relative">
          <div
            className="absolute inset-0 animate-fruitful-pulse rounded-full"
            style={{ backgroundColor: "var(--coral)", filter: "blur(40px)", opacity: 0.5 }}
          />
          <div className="relative rounded-full bg-white p-6">
            <FruitfulLogo className="h-24 w-24 animate-fruitful-bob object-contain" />
          </div>
        </div>

        {phase === "error" ? (
          <>
            <h2 className="mt-10 text-center font-display text-3xl font-bold leading-tight">
              Payment issue
            </h2>
            <p className="mt-3 text-center text-base text-white/70">
              {errorMsg ?? "Something went wrong with the payment."}
            </p>
            <div className="mt-8 flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => setPhase("idle")}
                className="flex h-14 w-full items-center justify-center rounded-full font-display text-base font-bold uppercase tracking-widest"
                style={{ backgroundColor: "var(--coral)" }}
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex h-14 w-full items-center justify-center rounded-full border border-white/25 font-display text-base font-bold uppercase tracking-widest"
              >
                Back to basket
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-10 text-center font-display text-3xl font-bold leading-tight">
              Awaiting payment…
            </h2>
            <p className="mt-3 text-center text-base text-white/70">
              {configured
                ? "Tap “Pay with card” to complete your order on the card screen."
                : "Following the prompts on the card terminal…"}
            </p>

            <div className="mt-8 w-full space-y-3">
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
                <span className="font-mono text-sm font-bold text-white">{orderRef ?? "—"}</span>
              </div>
            </div>

            {configured && phase === "idle" && (
              <button
                type="button"
                onClick={payWithCard}
                className="mt-8 flex h-16 w-full items-center justify-center gap-3 rounded-full font-display text-lg font-bold uppercase tracking-widest text-white transition-transform active:scale-[0.98]"
                style={{ backgroundColor: "var(--coral)" }}
              >
                <CreditCard className="h-6 w-6" />
                Pay with card
              </button>
            )}

            <div className="mt-10 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              <span
                className="h-2 w-2 animate-fruitful-pulse rounded-full"
                style={{ backgroundColor: "var(--sun)" }}
              />
              {configured
                ? "Paystack ZAR · Secure card payment"
                : "Demo mode · no payment gateway configured"}
            </div>
          </>
        )}
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
      <h2 className="mt-8 font-display text-4xl font-bold leading-tight text-white">Thank you.</h2>
      <p className="mt-3 max-w-xs text-base font-medium text-white/90">
        Your basket will be released at the collection hatch in a moment.
      </p>

      <div className="mt-8 w-full max-w-xs rounded-3xl bg-white p-5">
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
