-- ============================================================
-- Fruitful kiosk — orders + atomic stock decrement (Paystack phase)
-- The kiosk is unauthenticated: anon may INSERT via the place_order RPC only.
-- Order data is private: no anon SELECT on orders.
-- ============================================================

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  currency text NOT NULL DEFAULT 'ZAR',
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  payment_provider text NOT NULL DEFAULT 'paystack',
  payment_reference text,
  lines jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view orders"
  ON public.orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can update orders"
  ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER orders_touch_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------
-- Atomic order placement: insert the order (idempotent on order_ref)
-- and decrement stock for DB-backed products (bashedi_kidswear = ks-*,
-- samfox_prints = sf-*). Seed products (hats/pottery/nourish/apparel)
-- have no DB rows and keep client-side stock only.
-- SECURITY DEFINER: runs as table owner so anon callers can place
-- orders without touching the tables directly.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_order(
  p_order_ref text,
  p_currency text DEFAULT 'ZAR',
  p_total_cents integer DEFAULT 0,
  p_payment_provider text DEFAULT 'paystack',
  p_payment_reference text DEFAULT NULL,
  p_lines jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id uuid;
  v_line jsonb;
  v_product_id text;
  v_qty integer;
BEGIN
  INSERT INTO public.orders
    (order_ref, status, currency, total_cents, payment_provider, payment_reference, lines)
  VALUES
    (p_order_ref, 'paid', p_currency, p_total_cents, p_payment_provider, p_payment_reference, p_lines)
  ON CONFLICT (order_ref) DO NOTHING
  RETURNING id INTO v_order_id;

  -- Idempotent re-run (e.g. success screen refresh): return the existing order.
  IF v_order_id IS NULL THEN
    SELECT id INTO v_order_id FROM public.orders WHERE order_ref = p_order_ref;
    RETURN v_order_id;
  END IF;

  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_product_id := v_line->>'productId';
    v_qty := COALESCE((v_line->>'qty')::integer, 0);
    IF v_qty <= 0 THEN
      CONTINUE;
    END IF;

    IF v_product_id LIKE 'ks-%' THEN
      UPDATE public.bashedi_kidswear
        SET stock = GREATEST(stock - v_qty, 0), updated_at = now()
        WHERE id::text = substr(v_product_id, 4);
    ELSIF v_product_id LIKE 'sf-%' THEN
      UPDATE public.samfox_prints
        SET stock = GREATEST(stock - v_qty, 0), updated_at = now()
        WHERE id::text = substr(v_product_id, 4);
    END IF;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(text, text, integer, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, integer, text, text, jsonb) TO anon, authenticated;
