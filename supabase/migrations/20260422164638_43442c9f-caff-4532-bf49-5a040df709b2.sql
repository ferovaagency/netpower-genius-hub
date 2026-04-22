-- Make stock nullable so NULL means "consult price"
ALTER TABLE public.products ALTER COLUMN stock DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN stock DROP DEFAULT;

-- Discount percent on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;

-- Payment method + receipt url on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- Backfill orders.status if null
UPDATE public.orders SET status = 'pending' WHERE status IS NULL;

-- Receipts storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for receipts bucket
DROP POLICY IF EXISTS "Public can read receipts" ON storage.objects;
CREATE POLICY "Public can read receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Public can upload receipts" ON storage.objects;
CREATE POLICY "Public can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');

DROP POLICY IF EXISTS "Public can update receipts" ON storage.objects;
CREATE POLICY "Public can update receipts"
ON storage.objects FOR UPDATE
USING (bucket_id = 'receipts');