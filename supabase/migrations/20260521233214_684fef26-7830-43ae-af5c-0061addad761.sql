CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  show_in_home boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view brands" ON public.brands;
CREATE POLICY "Public can view brands" ON public.brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can manage brands" ON public.brands;
CREATE POLICY "Public can manage brands" ON public.brands FOR ALL
  USING (auth.role() = ANY (ARRAY['anon','authenticated']))
  WITH CHECK (auth.role() = ANY (ARRAY['anon','authenticated']));

DROP TRIGGER IF EXISTS trg_brands_updated_at ON public.brands;
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_brands_show_in_home ON public.brands (show_in_home, display_order);

-- Storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read brand logos" ON storage.objects;
CREATE POLICY "Public read brand logos" ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-logos');

DROP POLICY IF EXISTS "Public upload brand logos" ON storage.objects;
CREATE POLICY "Public upload brand logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'brand-logos');

DROP POLICY IF EXISTS "Public update brand logos" ON storage.objects;
CREATE POLICY "Public update brand logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'brand-logos');

DROP POLICY IF EXISTS "Public delete brand logos" ON storage.objects;
CREATE POLICY "Public delete brand logos" ON storage.objects FOR DELETE
  USING (bucket_id = 'brand-logos');