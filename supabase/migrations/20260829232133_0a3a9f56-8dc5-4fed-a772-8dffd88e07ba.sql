
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Seed existing accounts as admins so the store owner keeps access.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Reset catalog policies
DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY['bashedi_kidswear','samfox_prints','grand_paintings'] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- Column-level privileges: revoke all, grant back safe columns to anon/authenticated
REVOKE ALL ON public.bashedi_kidswear, public.samfox_prints, public.grand_paintings FROM anon, authenticated;
GRANT ALL ON public.bashedi_kidswear, public.samfox_prints, public.grand_paintings TO service_role;

GRANT SELECT (id, slot_number, image_url, name, description, long_description, item_code, sku, barcode,
  tags, size_label, age_range, fabric, color, gender, vat_rate, price_zar_cents, price_usd_cents, stock,
  weight_grams, is_featured, is_published, sort_order, brand, created_at, updated_at)
  ON public.bashedi_kidswear TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bashedi_kidswear TO authenticated;

GRANT SELECT ON public.samfox_prints TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samfox_prints TO authenticated;

GRANT SELECT ON public.grand_paintings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grand_paintings TO authenticated;

-- Public shoppers: published rows only (anon has no access to cost columns on kidswear)
CREATE POLICY "Public can view published kidswear" ON public.bashedi_kidswear
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "Public can view published prints" ON public.samfox_prints
  FOR SELECT TO anon USING (is_published = true);
CREATE POLICY "Public can view published paintings" ON public.grand_paintings
  FOR SELECT TO anon USING (is_published = true);

-- Admins: full access
CREATE POLICY "Admins manage kidswear" ON public.bashedi_kidswear
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage prints" ON public.samfox_prints
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage paintings" ON public.grand_paintings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
