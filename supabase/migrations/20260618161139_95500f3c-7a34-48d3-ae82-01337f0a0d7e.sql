CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'contact_form',
  customer_name text,
  customer_email text,
  customer_phone text,
  city text,
  subject text,
  message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT INSERT ON public.quote_requests TO anon;
GRANT ALL ON public.quote_requests TO service_role;

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_submit_quote"
  ON public.quote_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admin_select_quotes"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_update_quotes"
  ON public.quote_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_delete_quotes"
  ON public.quote_requests FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER trg_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX idx_quote_requests_created ON public.quote_requests(created_at DESC);