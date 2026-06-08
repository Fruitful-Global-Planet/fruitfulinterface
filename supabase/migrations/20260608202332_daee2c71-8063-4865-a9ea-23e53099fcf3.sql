-- Shared fields on both inventory tables
ALTER TABLE public.samfox_prints
  ADD COLUMN item_code text,
  ADD COLUMN sku text,
  ADD COLUMN barcode text,
  ADD COLUMN long_description text NOT NULL DEFAULT '',
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN weight_grams integer,
  ADD COLUMN width_cm numeric(6,2),
  ADD COLUMN height_cm numeric(6,2),
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN edition_size integer,
  ADD COLUMN edition_number integer,
  ADD COLUMN paper_type text,
  ADD COLUMN print_method text,
  ADD COLUMN is_signed boolean NOT NULL DEFAULT false;

ALTER TABLE public.grand_paintings
  ADD COLUMN item_code text,
  ADD COLUMN sku text,
  ADD COLUMN barcode text,
  ADD COLUMN long_description text NOT NULL DEFAULT '',
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN weight_grams integer,
  ADD COLUMN width_cm numeric(6,2),
  ADD COLUMN height_cm numeric(6,2),
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN medium text NOT NULL DEFAULT 'Acrylic on board',
  ADD COLUMN year_created integer,
  ADD COLUMN signed_by text NOT NULL DEFAULT 'Grand Machadlela',
  ADD COLUMN has_certificate boolean NOT NULL DEFAULT true,
  ADD COLUMN artist_name text NOT NULL DEFAULT 'Grand Machadlela',
  ADD COLUMN scene_location text NOT NULL DEFAULT '';

-- Backfill item_code / sku / sort_order from slot_number for existing rows
UPDATE public.samfox_prints
   SET item_code = COALESCE(item_code, 'SFX-' || LPAD(slot_number::text, 3, '0')),
       sku       = COALESCE(sku,       'SFX-PRINT-' || LPAD(slot_number::text, 3, '0')),
       sort_order = CASE WHEN sort_order = 0 THEN slot_number ELSE sort_order END;

UPDATE public.grand_paintings
   SET item_code = COALESCE(item_code, 'GRM-' || LPAD(slot_number::text, 3, '0')),
       sku       = COALESCE(sku,       'GRM-PAINT-' || LPAD(slot_number::text, 3, '0')),
       sort_order = CASE WHEN sort_order = 0 THEN slot_number ELSE sort_order END;

-- Uniqueness constraints (NULLs allowed, but no duplicate non-null values)
CREATE UNIQUE INDEX samfox_prints_item_code_key ON public.samfox_prints (item_code) WHERE item_code IS NOT NULL;
CREATE UNIQUE INDEX samfox_prints_sku_key       ON public.samfox_prints (sku)       WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX samfox_prints_barcode_key   ON public.samfox_prints (barcode)   WHERE barcode IS NOT NULL;

CREATE UNIQUE INDEX grand_paintings_item_code_key ON public.grand_paintings (item_code) WHERE item_code IS NOT NULL;
CREATE UNIQUE INDEX grand_paintings_sku_key       ON public.grand_paintings (sku)       WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX grand_paintings_barcode_key   ON public.grand_paintings (barcode)   WHERE barcode IS NOT NULL;

-- Insert slot 11 painting now that schema is ready
INSERT INTO public.grand_paintings (slot_number, image_url, name, stock, item_code, sku, sort_order)
VALUES (11, '/__l5e/assets-v1/446cbcf5-45d7-4b91-a14c-e062153ac1d6/grand-11.jpeg', 'Painting 11', 1,
        'GRM-011', 'GRM-PAINT-011', 11);