
ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS nit_cedula text;

CREATE TABLE IF NOT EXISTS public.neti_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  customer_name text,
  customer_email text,
  customer_phone text,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.neti_conversations TO anon, authenticated;
GRANT ALL ON public.neti_conversations TO service_role;

ALTER TABLE public.neti_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_insert_conversation" ON public.neti_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anyone_update_own_conversation" ON public.neti_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_read_conversations" ON public.neti_conversations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin_delete_conversations" ON public.neti_conversations FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_neti_conv_updated ON public.neti_conversations(updated_at DESC);
CREATE TRIGGER trg_neti_conv_updated_at BEFORE UPDATE ON public.neti_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
