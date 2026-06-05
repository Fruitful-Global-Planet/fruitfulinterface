## Goal

Build the **on-device touchscreen UI** that runs on the small tablet mounted on the physical **Fruitful Portal Kiosk** (teal cylindrical body, red lid, Mr Fruitful mascot). This is the customer-facing software *inside* the kiosk — not a Hercules mirror, not a marketing site. The 302 Dykor St address is the CIPC registration only; the kiosks deploy anywhere ("Made in the Bush").

## Hardware-driven UX constraints (from your mockups)

- **Form factor:** ~10" tablet mounted on the side of the kiosk, **portrait orientation** primary. Design and preview locked to mobile/tablet portrait.
- **Touch only.** No hover, ≥88px hit targets, large type, thumb-reachable bottom action bar.
- **Standing customer**, outdoor light → high contrast, no thin grey-on-grey.
- **Self-service unattended.** Idle attractor screen → tap to shop → cart → Paystack → receipt → returns to attractor after ~30s of idle.

## Brand (locked from your assets)

- **Colors:** mint/teal kiosk green `~#4FC3B0`, signature red `#E63946`, off-white `#F8F5F0`, dark text `#1A1A1A`. Optional cream `#F0E6D2` for artisan warmth.
- **Mascot:** Mr Fruitful (red pear/seed character) — uploaded logo becomes the brand mark.
- **Tagline:** "FRUITFUL. CHANGING. SEEDS." + sub: "If you don't like the fruits you are growing, change the seeds."
- **Type:** chunky friendly display (think Fredoka / Quicksand / Nunito) for headings to match the rounded logo, clean sans for body. Locked, no design directions round needed.
- **Voice:** "Support Local Artisans · Crafted in South Africa · Made in the Bush · Proudly Fruitful."

## Real catalog (replaces the cross-pollinated reference)

From your poster + the SAMFOX_30_PRINTS.csv + hat photo:
- **Artisan Hats** — beaded Fruitful fedora (R699 / ~$39), other hats
- **Kidswear** — Bashedi children rompers, traditional dresses (R649–R1249 / $35–$69)
- **SamFox Prints** — 30 wildlife fine-art prints from the CSV (Kruger Lion, Elephant Matriarch, etc.)
- **Artisan Pottery** — clay pots, ceramic mugs
- **Nourishment** — coffee (R89 / $5), pancakes (R89 / $5), seasonal
- **Apparel** — Fruitful-branded T-shirts
- Each product carries **artisan name + location** (it's the whole point).

## Phased build (revised)

### Phase 1 — Kiosk shell + idle attractor + catalog (this turn)
- Set preview to **mobile portrait** (tablet-sized).
- Brand tokens in `src/styles.css` (teal/red/cream + Fredoka/Nunito via Google Fonts).
- Upload logo + Mr Fruitful + hat hero as Lovable Assets.
- **Idle attractor screen**: full-bleed mint, Mr Fruitful + tagline + pulsing "TAP TO BEGIN" — reverts after 30s idle.
- **Catalog grid**: large product tiles with artisan name/location badge, ZAR primary + USD secondary, "Add to Basket" with haptic-style feedback.
- **Category strip** at top: Hats · Kidswear · Prints · Pottery · Nourishment · Apparel.
- **Persistent bottom basket bar** (always visible, thumb zone): item count + total + "Checkout".
- **Cart drawer** with line items, remove buttons, totals, "Pay at Kiosk" CTA.
- **Step machine**: `attractor → browse → cart → paying → success → attractor`.
- Catalog seeded in-memory for this phase from real data above.

### Phase 2 — Lovable Cloud + real catalog
- Enable Cloud (Supabase).
- Tables: `products`, `artisans`, `orders`, `order_items`, `telemetry_events`, `user_roles` (with RLS + GRANTs per platform rules).
- CSV importer for the 30 SamFox prints.
- Server fns: `getProducts`, `getProductsByCategory`, `createOrder`, `recordTelemetry`.

### Phase 3 — Paystack ZAR live + receipts
- Client uses Paystack Inline (`pk_test_…`), server verifies via `PAYSTACK_SECRET_KEY` (I'll request via secrets tool).
- Webhook route `/api/public/paystack-webhook` with HMAC-SHA512 verification.
- Stock decrement on verified payment.
- On-screen receipt with QR (order reference) for collection at the kiosk hatch.

### Phase 4 — Admin (separate auth-gated route)
- `/_authenticated/admin` for staff: products CRUD, CSV import, today's orders, low-stock alerts.
- Supabase email/password auth for staff only (shoppers never log in).

### Phase 5 — Polish
- Idle screensaver with rotating artisan stories.
- Sold-out and offline-mode states.
- Multi-kiosk node identifier (env var per device).
- Optional outbound telemetry to base44/Hercules later if you give me the endpoint.

## Decisions baked in

- **Mobile-portrait viewport** for design and preview.
- **No SecureSign 32-node fragment flow on the shopper UI** — that's a sovereign/admin handshake, not customer-facing. Keep as an optional admin unlock later.
- **No full Sage ERP** in MVP — basic stock + orders only. ERP layered in later if you want.
- **Real artisan attribution** on every product tile (this is the brand promise).

## What I need (just confirm to proceed)

Reply **"go"** and I'll execute Phase 1 immediately:
1. Set preview to mobile portrait.
2. Build the kiosk shell, idle attractor, brand tokens, 6-category catalog with the real product list above, persistent basket bar, cart drawer, and checkout state machine — all live in-memory.
3. Show you the running kiosk UI before we touch Cloud or Paystack.

No design-direction round needed — your brand and hardware already define the look.