/**
 * Kiosk state — checkout step machine + cart + idle timer.
 * Kept simple and local: a kiosk session belongs to one shopper at a time.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "./catalog";

export type KioskStep = "attractor" | "browse" | "cart" | "paying" | "success";

export type CartLine = {
  cartId: string;
  product: Product;
  qty: number;
};

const IDLE_TIMEOUT_MS = 45_000;

export function useKioskSession() {
  const [step, setStep] = useState<KioskStep>("attractor");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderRef, setOrderRef] = useState<string | null>(null);

  const total = useMemo(
    () => cart.reduce((sum, l) => sum + l.product.priceZAR * l.qty, 0),
    [cart],
  );
  const itemCount = useMemo(
    () => cart.reduce((sum, l) => sum + l.qty, 0),
    [cart],
  );

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.product.id === product.id);
      if (idx >= 0) {
        if (prev[idx].qty >= product.stock) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [
        ...prev,
        { cartId: `${product.id}-${Date.now()}`, product, qty: 1 },
      ];
    });
  }, []);

  const decrement = useCallback((cartId: string) => {
    setCart((prev) =>
      prev
        .map((l) => (l.cartId === cartId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((l) => l.cartId !== cartId));
  }, []);

  const beginCheckout = useCallback(() => {
    if (cart.length === 0) return;
    const ref = `FFL-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
    setOrderRef(ref);
    setStep("paying");
  }, [cart.length]);

  const completePayment = useCallback(() => {
    setStep("success");
  }, []);

  const cancelPayment = useCallback(() => {
    setStep("cart");
  }, []);

  const resetToAttractor = useCallback(() => {
    setCart([]);
    setOrderRef(null);
    setStep("attractor");
  }, []);

  // Idle timer — auto-reset to attractor after inactivity (only when not mid-payment/success)
  const lastActivity = useRef(Date.now());
  const bump = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);

  useEffect(() => {
    if (step === "attractor" || step === "paying") return;
    const id = window.setInterval(() => {
      if (Date.now() - lastActivity.current > IDLE_TIMEOUT_MS) {
        resetToAttractor();
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [step, resetToAttractor]);

  // On success, auto-return after 12s
  useEffect(() => {
    if (step !== "success") return;
    const id = window.setTimeout(resetToAttractor, 12_000);
    return () => window.clearTimeout(id);
  }, [step, resetToAttractor]);

  return {
    step,
    setStep,
    cart,
    total,
    itemCount,
    orderRef,
    addToCart,
    decrement,
    removeLine,
    beginCheckout,
    completePayment,
    cancelPayment,
    resetToAttractor,
    bump,
  };
}
