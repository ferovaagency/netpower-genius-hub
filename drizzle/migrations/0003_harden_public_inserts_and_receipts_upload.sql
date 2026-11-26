DROP POLICY IF EXISTS "anyone_can_insert_prospects" ON public.prospects;
CREATE POLICY "anyone_can_insert_prospects" ON public.prospects
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(email)) BETWEEN 5 AND 255
  AND email LIKE '%@%.%'
  AND length(trim(source)) BETWEEN 1 AND 80
  AND (subject IS NULL OR length(subject) <= 200)
);

DROP POLICY IF EXISTS "Public create availability requests" ON public.availability_requests;
CREATE POLICY "Public create availability requests" ON public.availability_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending'
  AND admin_notes IS NULL
  AND suggested_products = '[]'::jsonb
  AND total >= 0
  AND length(trim(customer_name)) BETWEEN 1 AND 200
  AND length(trim(customer_email)) BETWEEN 5 AND 255
  AND customer_email LIKE '%@%.%'
  AND (customer_phone IS NULL OR length(customer_phone) <= 50)
  AND jsonb_typeof(items) = 'array'
  AND jsonb_array_length(items) BETWEEN 1 AND 200
);

DROP POLICY IF EXISTS "anyone_can_submit_quote" ON public.quote_requests;
CREATE POLICY "anyone_can_submit_quote" ON public.quote_requests
FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'new'
  AND admin_notes IS NULL
  AND source IN ('contact_form', 'neti_chat')
  AND (
    (customer_email IS NOT NULL AND length(trim(customer_email)) BETWEEN 5 AND 255)
    OR (customer_phone IS NOT NULL AND length(trim(customer_phone)) BETWEEN 7 AND 50)
  )
  AND (customer_name IS NULL OR length(customer_name) <= 200)
  AND (customer_email IS NULL OR length(customer_email) <= 255)
  AND (customer_phone IS NULL OR length(customer_phone) <= 50)
  AND (city IS NULL OR length(city) <= 100)
  AND (nit_cedula IS NULL OR length(nit_cedula) <= 60)
  AND (subject IS NULL OR length(subject) <= 200)
  AND (message IS NULL OR length(message) <= 5000)
  AND jsonb_typeof(details) = 'object'
  AND octet_length(details::text) <= 200000
);

DROP POLICY IF EXISTS "Receipts public upload" ON storage.objects;
DROP POLICY IF EXISTS "Receipts admin insert" ON storage.objects;
CREATE POLICY "Receipts admin insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND public.is_admin());