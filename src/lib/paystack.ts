/**
 * Paystack inline-checkout integration for the Fruitful kiosk.
 *
 * The kiosk is a self-service terminal: the shopper pays with card inside the
 * Paystack iframe. When VITE_PAYSTACK_PUBLIC_KEY is not configured the kiosk
 * falls back to the built-in simulated payment (DEMO mode) so development and
 * offline demos keep working.
 */

export type PaystackPop = {
  setup: (opts: PaystackSetupOptions) => PaystackPopIframe;
};

export type PaystackSetupOptions = {
  key: string;
  email: string;
  /** Amount in the currency's smallest unit (cents for ZAR). */
  amount: number;
  currency: string;
  ref: string;
  callback: (response: { reference: string; trans?: string; status?: string }) => void;
  onClose: () => void;
  metadata?: Record<string, unknown>;
};

export type PaystackPopIframe = {
  openIframe: () => void;
};

declare global {
  interface Window {
    PaystackPop?: PaystackPop;
  }
}

const INLINE_JS_URL = "https://js.paystack.co/v1/inline.js";

export function paystackPublicKey(): string | null {
  return (import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined)?.trim() || null;
}

export function isPaystackConfigured(): boolean {
  return Boolean(paystackPublicKey());
}

export function paystackCustomerEmail(): string {
  return (
    (import.meta.env.VITE_PAYSTACK_CUSTOMER_EMAIL as string | undefined)?.trim() ||
    "kiosk@fruitful.store"
  );
}

let scriptPromise: Promise<void> | null = null;

/** Load Paystack's inline.js once; resolves when PaystackPop is ready. */
export function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = INLINE_JS_URL;
    s.async = true;
    s.onload = () => {
      if (window.PaystackPop) resolve();
      else {
        scriptPromise = null;
        reject(new Error("Paystack script loaded but PaystackPop is missing"));
      }
    };
    s.onerror = () => {
      scriptPromise = null; // allow retry
      reject(new Error("Could not load Paystack script"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}
