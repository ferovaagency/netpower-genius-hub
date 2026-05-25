
-- brand-logos: drop any public write policies, keep public read, admin manage
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname ILIKE '%brand%logo%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
  END LOOP;
END $$;

CREATE POLICY "Brand logos public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'brand-logos');
CREATE POLICY "Brand logos admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-logos' AND public.is_admin());
CREATE POLICY "Brand logos admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-logos' AND public.is_admin());
CREATE POLICY "Brand logos admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-logos' AND public.is_admin());

-- product-images: drop anon write policies, keep public read, admin manage
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polname ILIKE '%product%image%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
  END LOOP;
END $$;

CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');
CREATE POLICY "Product images admin insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Product images admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Product images admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
