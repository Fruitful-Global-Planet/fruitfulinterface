# Fruitful Interface — Current State & Stocktake

> Status audit of the `fruitfulinterface` repo (cloned from `Fruitful-Global-Planet/fruitfulinterface`).
> Date: 2026-08-27 · Branch: `main` (latest commit `a0f9c93` "Added admin Data Tools page")
> Stack: TanStack Start (SSR) + React 19 + Vite 7 + Tailwind 4 + Supabase + Bun, scaffolded from Lovable.

---

## 1. What works

### Kiosk flow (customer-facing, `/`)
- Full step machine: **attractor → browse → cart → paying → success**, back to attractor. (`src/lib/kiosk-store.ts`)
- Attractor ("tap to start") screen with brand logo, "Shop local. Pay fast. Grow good." headline and 01/02/03 how-it-works strip.
- **Idle safety**: 45s inactivity auto-reset to attractor (paused during payment), 12s auto-return after success.
- Touch-first layout: portrait, `max-w-[480px]` kiosk column; pointer/touch activity tracking.

### Browse & product discovery
- **6 mock departments**: Artisan Hats, Kidswear, SamFox Prints, Pottery, Nourishment, Apparel (`src/lib/catalog.ts` — **currently mock seed data**).
- **Grand Paintings (v1.6)**: live kiosk range wired from `grand_paintings` — new `paintings` category + `src/lib/grand-paintings.ts` hook (published-only, slot-ordered, subscription pricing, `gp-*` ids for the stock RPC); local fallback mirrors the 11 repo `grand/` canvases. **No admin editor yet.**
- Kidswear + Prints load live from **Supabase** (`bashedi_kidswear`, `samfox_prints`, published-only, RLS-protected); hats/pottery/nourish/apparel fall back to in-memory seed products.
- Kidswear: text search (item code / barcode / SKU / fabric / name), tag chips (age, size, fabric, gender, color), 5 sort modes, pagination (8/page), stock-aware "sold out" states, add-to-cart with stock cap.
- **Barcode lookup modal**: scans/types barcode, item code or SKU → jumps to product; recent-scans history in localStorage (max 8, clearable).
- **Kidswear detail screen**: full price breakdown (cost excl VAT → × markup → + VAT), specs grid (code, barcode, SKU, size, age, fabric, colour), copyable codes, sticky add-to-basket.
- Fixed basket dock with live ZAR total and item-count badge.

### Cart & checkout
- Cart lines with qty +/- (respects stock), remove line, ZAR total.
- **Payment — real Paystack wired (Phase 3), demo fallback**: with `VITE_PAYSTACK_PUBLIC_KEY` set, "Pay with card" opens the Paystack inline card screen; the transaction is verified **server-side** (`PAYSTACK_SECRET_KEY` → `GET /transaction/verify/{ref}`) before the kiosk completes. Without a key, the kiosk falls back to the 3.5s simulated terminal ("Demo mode") so dev/demos keep working.
- **Orders are persisted**: `place_order` RPC inserts the order (idempotent on the `FFL-*` ref, provider `paystack`|`demo`, Paystack reference, jsonb lines) and **atomically decrements stock** for DB-backed products (kidswear/prints). Record failures never block the shopper (paid → success + staff toast).
- No refunds/void flow yet; seed-category products (hats/pottery/nourish/apparel) still track stock client-side only.

### Admin (`/admin`, unauthenticated until sign-in)
- Tabs: **Orders / SamFox Prints / Bashedi Kidswear / Data Tools** (redirect `/admin/` → `/admin/prints`).
- Supabase auth: email+password sign-in **and sign-up** flows; session-driven UI.
- **Orders tab** (`/admin/orders`): read-only sales list — status pills (paid/pending/failed/cancelled), provider badge (paystack/demo), expandable line items with unit prices, paid totals + refresh.
- **Prints editor**: edit name, description, ZAR + USD price, stock, published toggle; saves to `samfox_prints`.
- **Kidswear editor**: full CRUD fields, **auto price calculator** `cost × markup × (1+VAT)` (defaults 3.5× / 15%), live cost/excl/VAT/sell breakdown, image upload to Supabase Storage (`kidswear-images` bucket, 10-year signed URL), **bulk CSV import** with downloadable template (matches rows by `item_code`, inserts or updates, recomputes prices, reports per-row errors).
- **Data Tools** (`/admin/tools`): password generator, QR code, barcode (with **local Code128 SVG fallback** when the API Ninjas endpoint is unavailable), EU VAT validation, unemployment stats, IP lookup — all via API Ninjas **server-side** (key never hits the browser).

### Kiosk UX plumbing
- Single-scroller scroll system (`src/lib/kiosk-scroll.ts`): one root vertical scroller per screen, sticky header/dock measured via `ResizeObserver` → CSS vars + scroll-padding (no content hides under chrome), per-screen scroll-position memory, quick-jump anchors ("Overview / Filters / Products / Pages").
- Playwright **e2e test** exists for exactly this: `tests/e2e/kiosk_scroll_e2e.py` (3 viewports: phone 390×844, kiosk 480×1280, desktop 1280×800) — verifies single scroller, bottom reachability, anchor-jump under sticky header.
- Design system: Fredoka + Nunito, oklch tokens (mint ≈ #5FCBB4, coral #E63946, cream, ink, sun), dark-mode tokens, branded keyframes; `user-select:none` + no tap highlight (kiosk feel).

### Server & error handling
- SSR via TanStack Start with a **catastrophic-SSR error wrapper** (`src/server.ts`) that catches h3-swallowed errors and renders a branded error page; Lovable error reporting hookup.
- Supabase auth token auto-attached to server functions via middleware (`auth-attacher`).

### Data layer (Supabase)
- 6 migrations: `samfox_prints` (10 seeded rows), `grand_paintings` (table + 11th row seeded), shared product fields (item_code/sku/barcode/tags/edition data), `bashedi_kidswear` (full catalog table with pricing model), storage policies for `kidswear-images` bucket, **`orders` + `place_order` RPC (20260827120000)** — atomic order insert + stock decrement, anon insert only via RPC, no anon read.
- RLS: anon can read only published rows; authenticated full CRUD.
- `.env` present with `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (+ `VITE_*` variants). **No `API_NINJAS_KEY`** → Data Tools will error until it's set.

### Tooling
- `bun install` works (422 packages, ~97s). Scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.
- Build verified up to the Vite entry; **local build currently blocked by Node version** (see §4 gaps).

---

## 2. What assets are in the repo

All images are Lovable asset manifests (`.asset.json` → CDN `url` + `r2_key`), referenced via typed imports.

### Brand & banners (9)
- `brand/`: fruitful-mark (used as the kiosk logo), proudly-fruitful, madiba-tata
- `banners/`: fruitful-logo, fruitful-global, doggy-station, planet-change, support-locals, thank-you
- Root: fruitful-hat (used as the Fedora product image), fruitful-changing-seeds, fruitful-kiosk, mr-fruitful-logo

### Product artwork
- `samfox/`: **30 print images** (01–30) — DB seeded with 10, assets ready for all 30
- `kidswear/`: **12 kidswear images** (01–12)
- `grand/`: **11 Grand Machadlela paintings** (01–11) — table exists in DB, **no UI consumes them yet**
- `global/`: be-fruitful-poster, fruitful-icon (global-brand material, currently unused)

### Code surface (src/)
- `routes/`: `/` (kiosk), `/admin`, `/admin/prints`, `/admin/kidswear`, `/admin/tools`
- `components/kiosk/`: AttractorScreen, BrowseScreen, CartScreen, CheckoutScreens (Paying+Success), BarcodeLookup, KidswearDetailScreen, FruitfulLogo
- `components/admin/`: CsvImport (+ 44 shadcn/ui primitives in `components/ui/`)
- `lib/`: catalog (seed), kidswear + samfox-prints (Supabase hooks), kiosk-store, kiosk-scroll, kidswear-pricing, barcode-code128, scan-history, banners, error handling, `api/` (ninjas server functions)
- `integrations/supabase/`: client, auth middleware/attacher, generated types
- `supabase/migrations/`: 5 SQL files (see Data layer)

---

## 3. What we have vs. what's still missing

### Have (solid foundation)
- Full kiosk UX skeleton (attractor → browse → cart → pay → success) that mirrors the **McDonald's-style self-service flow** the brand wants.
- Working admin for the two flagship ranges (Kidswear, SamFox) with pricing logic and bulk import.
- Real product imagery (30 prints, 12 kidswear, 11 grand) already in the asset CDN.
- Supabase schema + RLS + auth + storage for the catalog.
- Scroll/e2e discipline with a regression test.

### Missing / still to do
- **The concluded menu is NOT implemented** — current categories/products are placeholders ("completely mock"). Need the concluded menu to replace `CATEGORIES` + `PRODUCTS` (and decide DB-driven vs config-driven).
- **Orders migration not yet applied** to the live Supabase project — apply `supabase/migrations/20260827120000_orders_paystack.sql` (supabase CLI / Lovable Cloud) and regenerate `src/integrations/supabase/types.ts`.
- **Paystack keys not set yet** — `VITE_PAYSTACK_PUBLIC_KEY` + `PAYSTACK_SECRET_KEY` are empty placeholders, so the kiosk runs in demo-payment mode until configured (Lovable Cloud env / local shell; never commit the secret).
- **No refunds/void flow** and no receipt printing; order status transitions are insert-only (`paid` on creation).
- **Grand paintings**: assets + DB table ready — **kiosk range live since v1.6**; admin editor + `place_order` stock decrement for `gp-*` still pending.
- **Non-kidswear detail screens**: only Kidswear opens a detail view; hats/pottery/prints (seed) open nothing.
- **Placeholder imagery**: several seed products use Unsplash stock photos rather than real product shots.
- **`API_NINJAS_KEY`** env missing → Data Tools fails at runtime until configured.
- **Local build blocked**: managed Node is v20.12.0, Vite 7 needs ≥20.19 (or 22.12+). Builds fine on Lovable Cloud / Node 22; local `bun run build` needs a Node upgrade.
- **No root README**; package/repo name still the Lovable default `tanstack_start_ts`.
- **Admin hardening**: open sign-up, no roles, no audit trail, no per-kiosk permissions.
- **USD pricing is a hardcoded display conversion** (no live FX / region pricing).
- **No offline mode** (Supabase fetch on every load; kiosk is internet-dependent).
- **No kiosk-hardware integration**: no fullscreen/kiosk-lock, no receipt printer, no card-terminal handoff, no cash drawer.
- **No globalisation layer** (see §4).

---

## 4. Core directive: "think global" (McDonald's-kiosk paradigm)

The reference model is a **globally consistent self-service interface** — same UX everywhere, localized per market. Current state is **South-Africa-first and hardcoded**. To make it globally adaptive:

- **Menu as data, not code**: categories/items/pricing/availability must be config- or DB-driven per kiosk/market (today they're hardcoded in `catalog.ts`).
- **i18n**: all strings are hardcoded English (`__root.tsx` is `lang="en"`); needs locale layer + RTL support for future markets.
- **Currency & money**: ZAR is the only true currency (USD is a static display value); needs multi-currency + live rates + locale number/date formatting.
- **Tax model**: VAT hardcoded 15% (ZA); needs per-region tax/VAT/GST rules (already has a per-row `vat_rate`, good hook).
- **Payment rails per region**: card (Paystack in ZA) → later mobile money (M-Pesa etc.), QR wallets, cash-at-counter.
- **Barcode standards**: sample values use SA/EAN patterns; global kiosks need UPC/EAN-13/regional handling.
- **Accessibility & hardware**: large touch targets, high contrast in outdoor light, voice/visual guidance, kiosk-lock + remote fleet management (updates, monitoring, remote reset), offline resilience, analytics per kiosk.

---

## 5. Recommended next steps (priority order)

1. **Replace the mock menu with the concluded menu** — share the concluded menu (categories, items, pricing, imagery); we wire it in as DB-driven catalog or config.
2. **Decide the category architecture** — integrate Grand paintings; define the global category taxonomy (maps 1:1 to the "globally adapted" menu).
3. **Activate payments** — apply the orders migration to live Supabase, regenerate types, add Paystack keys (test mode), smoke-test one real card order end-to-end.
4. **Globalisation layer** — locale, currency, tax, payment-method abstraction.
5. **Kiosk hardware mode** — fullscreen lock, offline cache, printer/terminal hooks, fleet settings.
6. **Admin hardening** — refunds/voids, roles, audit log.
7. **Housekeeping** — README, rename package/repo, upgrade local Node to 22 for local builds, add `API_NINJAS_KEY`.
