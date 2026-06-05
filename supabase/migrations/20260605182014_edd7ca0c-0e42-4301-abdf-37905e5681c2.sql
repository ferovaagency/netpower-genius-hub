
CREATE TABLE public.prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'exit_intent',
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT INSERT ON public.prospects TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.prospects TO authenticated;
GRANT ALL ON public.prospects TO service_role;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_insert_prospects" ON public.prospects FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins_can_select_prospects" ON public.prospects FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins_can_update_prospects" ON public.prospects FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "admins_can_delete_prospects" ON public.prospects FOR DELETE TO authenticated USING (public.is_admin());
