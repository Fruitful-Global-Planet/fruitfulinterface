import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AttractorScreen } from "@/components/kiosk/AttractorScreen";
import { BrowseScreen } from "@/components/kiosk/BrowseScreen";
import { CartScreen } from "@/components/kiosk/CartScreen";
import { PayingScreen, SuccessScreen } from "@/components/kiosk/CheckoutScreens";
import { useKioskSession } from "@/lib/kiosk-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fruitful Portal · Kiosk" },
      {
        name: "description",
        content:
          "Fruitful Portal — the on-device touchscreen that powers Fruitful's artisan kiosks across South Africa.",
      },
      { property: "og:title", content: "Fruitful Portal · Kiosk" },
      {
        property: "og:description",
        content: "Changing seeds. Supporting local artisans. Crafted in South Africa.",
      },
    ],
  }),
  component: Kiosk,
});

function Kiosk() {
  const k = useKioskSession();

  // Bump idle timer on any touch/click anywhere in the kiosk.
  useEffect(() => {
    const handler = () => k.bump();
    window.addEventListener("pointerdown", handler);
    window.addEventListener("touchstart", handler, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [k]);

  return (
    <div
      className="mx-auto flex h-svh max-w-[480px] flex-col overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {k.step === "attractor" && <AttractorScreen onBegin={() => k.setStep("browse")} />}

      {k.step === "browse" && (
        <BrowseScreen
          cart={k.cart}
          itemCount={k.itemCount}
          total={k.total}
          onAdd={k.addToCart}
          onOpenCart={() => k.setStep("cart")}
          onClose={k.resetToAttractor}
        />
      )}

      {k.step === "cart" && (
        <CartScreen
          cart={k.cart}
          total={k.total}
          onBack={() => k.setStep("browse")}
          onAdd={k.addToCart}
          onDecrement={k.decrement}
          onRemove={k.removeLine}
          onCheckout={k.beginCheckout}
        />
      )}

      {k.step === "paying" && (
        <PayingScreen
          total={k.total}
          orderRef={k.orderRef}
          cart={k.cart}
          onCancel={k.cancelPayment}
          onComplete={k.completePayment}
        />
      )}

      {k.step === "success" && (
        <SuccessScreen total={k.total} orderRef={k.orderRef} onDone={k.resetToAttractor} />
      )}
    </div>
  );
}
