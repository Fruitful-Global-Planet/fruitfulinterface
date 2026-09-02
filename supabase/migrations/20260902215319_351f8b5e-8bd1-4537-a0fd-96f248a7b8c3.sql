CREATE TABLE public.nexus_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  barcode text,
  profile_length_mm integer NOT NULL DEFAULT 1500,
  carton_qty integer NOT NULL DEFAULT 10,
  container_config text NOT NULL DEFAULT '',
  cost_price_excl_vat_cents integer NOT NULL DEFAULT 75000,
  logistics_allocation_cents integer NOT NULL DEFAULT 30000,
  selling_price_excl_vat_cents integer NOT NULL DEFAULT 165000,
  vat_rate numeric NOT NULL DEFAULT 0.15,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.nexus_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nexus_items TO authenticated;
GRANT ALL ON public.nexus_items TO service_role;

ALTER TABLE public.nexus_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active nexus items" ON public.nexus_items
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "Admins manage nexus items" ON public.nexus_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.nexus_approval_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ref text NOT NULL UNIQUE,
  request_type text NOT NULL DEFAULT 'credit_limit',
  store_name text NOT NULL,
  contact_phone text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'field',
  amount_zar_cents integer NOT NULL DEFAULT 0,
  qty integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_by uuid REFERENCES auth.users(id),
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.nexus_approval_requests TO authenticated;
GRANT UPDATE (status, decided_by, decided_at) ON public.nexus_approval_requests TO authenticated;
GRANT ALL ON public.nexus_approval_requests TO service_role;

ALTER TABLE public.nexus_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view approval requests" ON public.nexus_approval_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can lodge approval requests" ON public.nexus_approval_requests
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins decide approval requests" ON public.nexus_approval_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.nexus_items (item_code, name, description, barcode, carton_qty, container_config, stock, sort_order) VALUES
('EPS01', 'Classic Cove 90', 'Clean 90mm cove profile, 1.5m Cornice Saver length. Car-boot friendly, single-operator install.', '6009900000012', 12, '40ft HC: 2,880 cartons', 240, 1),
('EPS02', 'Classic Cove 120', 'Deeper 120mm cove for double-volume rooms. 1.5m block, no mid-span sag on ladder.', '6009900000029', 10, '40ft HC: 2,400 cartons', 180, 2),
('EPS03', 'Stepped Deco 3', 'Three-step art-deco profile for feature walls and passages.', '6009900000036', 10, '40ft HC: 2,400 cartons', 150, 3),
('EPS04', 'Shadowline 15', 'Modern shadow-gap profile, 15mm reveal. Popular in new townhouse developments.', '6009900000043', 12, '40ft HC: 2,880 cartons', 200, 4),
('EPS05', 'Bullnose 75', 'Soft bullnose edge for bedrooms and kitchens. Minimal offcut waste at 1.5m.', '6009900000050', 12, '40ft HC: 2,880 cartons', 160, 5),
('EPS06', 'Victorian 140', 'Ornate 140mm Victorian profile for heritage renovations.', '6009900000067', 8, '40ft HC: 1,920 cartons', 90, 6),
('EPS07', 'Slimline 50', 'Minimal 50mm slimline for low-cost housing and compact bathrooms.', '6009900000074', 16, '40ft HC: 3,840 cartons', 300, 7),
('EPS08', 'Double Cove 90', 'Twin-cove detail profile. One-man install, 40% faster on ladder.', '6009900000081', 12, '40ft HC: 2,880 cartons', 140, 8),
('EPS09', 'Cornice Saver Bulk', 'Contractor pack: plain 90mm cove, bulk carton for site rollouts.', '6009900000098', 20, '40ft HC: 4,800 cartons', 400, 9),
('EPS10', 'Corner Block Set', 'Pre-mitred internal/external corner blocks, 1.5m system compatible.', '6009900000104', 24, '40ft HC: 5,760 cartons', 220, 10),
('EPS11', 'Ceiling Rose 400', '400mm ceiling rose, ships flat in the 1.5m carton standard.', '6009900000111', 6, '40ft HC: 1,440 cartons', 60, 11),
('EPS12', 'Adhesive Starter Kit', 'Cornice adhesive + tooling starter kit for DIY car-boot customers.', '6009900000128', 10, '40ft HC: 2,400 cartons', 180, 12);