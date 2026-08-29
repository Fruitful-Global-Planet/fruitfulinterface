-- ============================================================
-- Art is subscription, not an outright purchase.
-- 1) Add pricing_model + monthly rate to both art tables
-- 2) Existing art becomes 'subscription' (monthly = 10% of list, rounded to R5)
-- 3) Seed The Chief (Sam Fox illustration) + Grand Grant A canvas
-- ============================================================

ALTER TABLE public.samfox_prints
  ADD COLUMN pricing_model text NOT NULL DEFAULT 'one-time',
  ADD COLUMN subscription_zar_cents integer;

ALTER TABLE public.grand_paintings
  ADD COLUMN pricing_model text NOT NULL DEFAULT 'one-time',
  ADD COLUMN subscription_zar_cents integer;

UPDATE public.samfox_prints
   SET pricing_model = 'subscription',
       subscription_zar_cents = ROUND(price_zar_cents * 0.1 / 500) * 500
 WHERE pricing_model = 'one-time';

UPDATE public.grand_paintings
   SET pricing_model = 'subscription',
       subscription_zar_cents = ROUND(price_zar_cents * 0.1 / 500) * 500
 WHERE pricing_model = 'one-time';

-- The Chief (Sam Fox illustration) — kiosk 4th print
INSERT INTO public.samfox_prints
  (slot_number, image_url, name, description, price_zar_cents, price_usd_cents, stock, is_published, item_code, sku, pricing_model, subscription_zar_cents)
VALUES
  (11, 'https://sc02.alicdn.com/kf/A5ac67f9e35b642d3a90b437a1f7f5644u.png', 'The Chief — Original',
   'Original Sam Fox illustration — the one-eyed guardian of the bush. One-of-one, hand-finished.',
   165000, 10800, 3, true, 'CHIEF-01', 'SF-CHIEF-01', 'subscription', 16500)
ON CONFLICT (slot_number) DO NOTHING;

-- Grand hand-painted canvas — kiosk prints range + grand_paintings range
INSERT INTO public.samfox_prints
  (slot_number, image_url, name, description, price_zar_cents, price_usd_cents, stock, is_published, item_code, sku, pricing_model, subscription_zar_cents)
VALUES
  (12, 'https://sc02.alicdn.com/kf/A3a817b8ad35049bdbc11b078ea3c4af3d.png', 'Grand — Grant A Canvas',
   'Hand-painted canvas by Grand Machadlela. One-of-one — no two alike.',
   245000, 16000, 2, true, 'GRANT-A-01', 'GRAND-001', 'subscription', 24500)
ON CONFLICT (slot_number) DO NOTHING;

INSERT INTO public.grand_paintings
  (slot_number, image_url, name, description, price_zar_cents, price_usd_cents, stock, is_published, item_code, sku, pricing_model, subscription_zar_cents)
VALUES
  (12, 'https://sc02.alicdn.com/kf/A3a817b8ad35049bdbc11b078ea3c4af3d.png', 'Grand — Grant A Canvas',
   'Hand-painted canvas by Grand Machadlela. One-of-one.',
   245000, 16000, 1, true, 'GRANT-A-01', 'GRAND-001', 'subscription', 24500)
ON CONFLICT (slot_number) DO NOTHING;
