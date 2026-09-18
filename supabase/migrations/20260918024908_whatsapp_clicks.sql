-- Clics a WhatsApp desde el sitio.
--
-- Por que existe: hasta ahora el clic a WhatsApp solo se enviaba a GA4 y a Ads.
-- Servia para medir, pero no para trabajar: nadie podia abrir el panel y ver a
-- quien le escribieron, desde que producto, ni si venia de pauta.
--
-- Limite que esta tabla NO resuelve y no puede resolver: si la persona
-- efectivamente ESCRIBIO el mensaje. WhatsApp corre fuera del sitio y no
-- devuelve nada. Por eso cada clic lleva un `ref_code` corto que va dentro del
-- texto prellenado del mensaje: cuando el mensaje llega a WhatsApp trae ese
-- codigo, y desde el panel se marca `escribio` a mano. Es semiautomatico a
-- proposito; cualquier otra cosa seria inventarse un dato.

CREATE TABLE IF NOT EXISTS public.whatsapp_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL UNIQUE,
  origen text,                      -- data-wa-origen del enlace: ficha_principal, ficha_faq, header...
  page_path text,
  product_sku text,
  product_name text,
  canal text,                       -- Pauta Google Ads | Pauta | Organico | Directo | Referido | Desconocido
  atribucion jsonb NOT NULL DEFAULT '{}'::jsonb,
  escribio boolean,                 -- NULL = sin confirmar. No es lo mismo que false.
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_clicks TO anon, authenticated;
GRANT ALL ON public.whatsapp_clicks TO service_role;

ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede registrar su propio clic: pasa antes de que haya sesion.
CREATE POLICY "anyone_insert_wa_click" ON public.whatsapp_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Leer y marcar "escribio" es solo del admin: aca hay datos de atribucion.
CREATE POLICY "admin_read_wa_clicks" ON public.whatsapp_clicks
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin_update_wa_clicks" ON public.whatsapp_clicks
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_wa_clicks" ON public.whatsapp_clicks
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_wa_clicks_created ON public.whatsapp_clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_clicks_canal ON public.whatsapp_clicks(canal);

CREATE TRIGGER trg_wa_clicks_updated_at BEFORE UPDATE ON public.whatsapp_clicks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
