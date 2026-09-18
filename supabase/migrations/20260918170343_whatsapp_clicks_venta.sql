-- Cierre de venta sobre el clic de WhatsApp.
--
-- Completa el embudo que ya media la tabla:
--   entran   = filas registradas (el clic al boton)
--   escriben = escribio = true
--   cierran  = vendio  = true
--
-- Los tres campos son boolean NULLABLE a proposito. NULL significa "todavia no
-- se confirmo", que NO es lo mismo que "no". Un false dice que se verifico y no
-- paso; un NULL dice que nadie lo reviso. Colapsar los dos en un false haria
-- ver como perdidas conversaciones que siguen abiertas, y la tasa de cierre
-- saldria peor de lo que es.
--
-- valor_venta va en pesos enteros: no hay centavos en una venta de UPS y un
-- numeric con decimales solo invita a errores de redondeo al sumar.

ALTER TABLE public.whatsapp_clicks
  ADD COLUMN IF NOT EXISTS vendio boolean,
  ADD COLUMN IF NOT EXISTS valor_venta bigint;

COMMENT ON COLUMN public.whatsapp_clicks.vendio IS
  'NULL = sin confirmar, true = se cerro la venta, false = se verifico que no se cerro';
COMMENT ON COLUMN public.whatsapp_clicks.valor_venta IS
  'Valor de la venta en COP enteros. Solo tiene sentido cuando vendio = true.';

CREATE INDEX IF NOT EXISTS idx_wa_clicks_vendio ON public.whatsapp_clicks(vendio);
