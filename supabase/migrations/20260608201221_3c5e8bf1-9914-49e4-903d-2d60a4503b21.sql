CREATE TABLE public.grand_paintings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number integer NOT NULL UNIQUE,
  image_url text NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price_zar_cents integer NOT NULL DEFAULT 450000,
  price_usd_cents integer NOT NULL DEFAULT 25000,
  stock integer NOT NULL DEFAULT 1,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.grand_paintings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grand_paintings TO authenticated;
GRANT ALL ON public.grand_paintings TO service_role;

ALTER TABLE public.grand_paintings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published paintings" ON public.grand_paintings
  FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert paintings" ON public.grand_paintings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update paintings" ON public.grand_paintings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete paintings" ON public.grand_paintings
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER touch_grand_paintings_updated_at
  BEFORE UPDATE ON public.grand_paintings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();