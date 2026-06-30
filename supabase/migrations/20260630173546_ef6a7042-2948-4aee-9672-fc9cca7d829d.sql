
CREATE TABLE public.bashedi_kidswear (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_number integer NOT NULL UNIQUE,
  image_url text NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  item_code text UNIQUE,
  sku text UNIQUE,
  barcode text,
  tags text[] NOT NULL DEFAULT '{}',
  size_label text NOT NULL DEFAULT '',
  age_range text NOT NULL DEFAULT '',
  fabric text NOT NULL DEFAULT 'Cotton blend',
  color text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT 'unisex',
  cost_price_excl_vat_cents integer NOT NULL DEFAULT 40000,
  markup_multiplier numeric NOT NULL DEFAULT 3.5,
  vat_rate numeric NOT NULL DEFAULT 0.15,
  price_zar_cents integer NOT NULL DEFAULT 161000,
  price_usd_cents integer NOT NULL DEFAULT 9000,
  stock integer NOT NULL DEFAULT 5,
  weight_grams integer,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  brand text NOT NULL DEFAULT 'Bashedi Kidswear',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.bashedi_kidswear TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bashedi_kidswear TO authenticated;
GRANT ALL ON public.bashedi_kidswear TO service_role;

ALTER TABLE public.bashedi_kidswear ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published kidswear" ON public.bashedi_kidswear
  FOR SELECT TO public
  USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert kidswear" ON public.bashedi_kidswear
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update kidswear" ON public.bashedi_kidswear
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete kidswear" ON public.bashedi_kidswear
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER bashedi_kidswear_touch_updated_at
  BEFORE UPDATE ON public.bashedi_kidswear
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
