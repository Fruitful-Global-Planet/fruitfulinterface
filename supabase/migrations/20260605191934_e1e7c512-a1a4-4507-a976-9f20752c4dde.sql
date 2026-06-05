
CREATE TABLE public.samfox_prints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number INTEGER NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_zar_cents INTEGER NOT NULL DEFAULT 145000,
  price_usd_cents INTEGER NOT NULL DEFAULT 9500,
  stock INTEGER NOT NULL DEFAULT 10,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.samfox_prints TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.samfox_prints TO authenticated;
GRANT ALL ON public.samfox_prints TO service_role;

ALTER TABLE public.samfox_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published prints"
  ON public.samfox_prints FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated can insert prints"
  ON public.samfox_prints FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update prints"
  ON public.samfox_prints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete prints"
  ON public.samfox_prints FOR DELETE
  TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER samfox_prints_touch BEFORE UPDATE ON public.samfox_prints
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.samfox_prints (slot_number, image_url, name, description) VALUES
(1, '/__l5e/assets-v1/eac50b26-0d6e-470c-8511-dfe831518c64/samfox-01.png', 'Print 1', ''),
(2, '/__l5e/assets-v1/29791a20-cb9b-4979-8aae-55bab84e42ab/samfox-02.png', 'Print 2', ''),
(3, '/__l5e/assets-v1/fd8496fe-8b04-4d98-98d8-ea1322b9f2d3/samfox-03.png', 'Print 3', ''),
(4, '/__l5e/assets-v1/354c9b57-271d-46a9-aad7-936840f30265/samfox-04.png', 'Print 4', ''),
(5, '/__l5e/assets-v1/4e1d57fa-0120-4f72-8b05-24d84b6fac61/samfox-05.png', 'Print 5', ''),
(6, '/__l5e/assets-v1/940a1a2e-b5a8-4e9e-87ff-f916f011a46a/samfox-06.png', 'Print 6', ''),
(7, '/__l5e/assets-v1/25183845-b623-413b-b13f-5694673b0480/samfox-07.png', 'Print 7', ''),
(8, '/__l5e/assets-v1/574c6583-59c4-4407-8e1d-3e6ceeeb0337/samfox-08.png', 'Print 8', ''),
(9, '/__l5e/assets-v1/36c65fbb-7691-421a-bd6b-f4ef6a4b63a6/samfox-09.png', 'Print 9', ''),
(10, '/__l5e/assets-v1/fbc4a822-0dc7-4861-b729-f755d63a9341/samfox-10.png', 'Print 10', '');
