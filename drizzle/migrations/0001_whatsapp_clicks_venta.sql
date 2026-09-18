ALTER TABLE public.whatsapp_clicks
  ADD COLUMN IF NOT EXISTS vendio boolean,
  ADD COLUMN IF NOT EXISTS valor_venta bigint;

COMMENT ON COLUMN public.whatsapp_clicks.vendio IS
  'NULL = sin confirmar, true = se cerro la venta, false = se verifico que no se cerro';
COMMENT ON COLUMN public.whatsapp_clicks.valor_venta IS
  'Valor de la venta en COP enteros. Solo tiene sentido cuando vendio = true.';

CREATE INDEX IF NOT EXISTS idx_wa_clicks_vendio ON public.whatsapp_clicks(vendio);