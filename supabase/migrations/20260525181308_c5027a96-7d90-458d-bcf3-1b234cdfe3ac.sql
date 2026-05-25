
-- 1. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Products
DROP POLICY IF EXISTS "Public can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public view active products" ON public.products
  FOR SELECT TO anon, authenticated USING (active = true OR public.is_admin());
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Blogs
DROP POLICY IF EXISTS "public_all_blogs" ON public.blogs;
CREATE POLICY "Public view published blogs" ON public.blogs
  FOR SELECT TO anon, authenticated USING (publicado = true OR public.is_admin());
CREATE POLICY "Admins manage blogs" ON public.blogs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Brands
DROP POLICY IF EXISTS "Public can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Public can view brands" ON public.brands;
CREATE POLICY "Public view brands" ON public.brands
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage brands" ON public.brands
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Orders: allow public INSERT for checkout; admins manage all; SELECT only via SECURITY DEFINER functions
DROP POLICY IF EXISTS "Public can manage orders" ON public.orders;
CREATE POLICY "Public create orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read orders" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete orders" ON public.orders
  FOR DELETE TO authenticated USING (public.is_admin());

-- 6. Customers: admins only
DROP POLICY IF EXISTS "Public can manage customers" ON public.customers;
CREATE POLICY "Admins manage customers" ON public.customers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. Availability requests: public insert, admin manage
DROP POLICY IF EXISTS "Public can manage availability requests" ON public.availability_requests;
CREATE POLICY "Public create availability requests" ON public.availability_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read availability requests" ON public.availability_requests
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins update availability requests" ON public.availability_requests
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete availability requests" ON public.availability_requests
  FOR DELETE TO authenticated USING (public.is_admin());

-- 8. Secure functions for public order lookups
CREATE OR REPLACE FUNCTION public.get_order_by_reference_email(_reference text, _email text)
RETURNS SETOF public.orders LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.orders
  WHERE reference = upper(trim(_reference))
    AND lower(customer_email) = lower(trim(_email))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_order_status_by_reference(_reference text)
RETURNS TABLE (reference text, status text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT reference, status FROM public.orders
  WHERE reference = upper(trim(_reference))
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_order_by_reference_email(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_reference_email(text, text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.get_order_status_by_reference(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status_by_reference(text) TO anon, authenticated;

-- 9. Receipts bucket: private, admin-only read, public insert
UPDATE storage.buckets SET public = false WHERE id = 'receipts';

DROP POLICY IF EXISTS "Public can read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Receipts admin read" ON storage.objects;
DROP POLICY IF EXISTS "Receipts public upload" ON storage.objects;

CREATE POLICY "Receipts public upload" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Receipts admin read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Receipts admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin());

CREATE POLICY "Receipts admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'receipts' AND public.is_admin());
