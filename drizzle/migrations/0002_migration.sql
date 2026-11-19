DROP POLICY IF EXISTS anyone_update_own_conversation ON public.neti_conversations;
DROP POLICY IF EXISTS anyone_insert_conversation ON public.neti_conversations;

CREATE OR REPLACE FUNCTION public.save_neti_conversation(
  _session_id text, _customer_name text, _customer_email text, _customer_phone text, _messages jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _session_id IS NULL OR length(_session_id) < 16 OR length(_session_id) > 100 THEN
    RAISE EXCEPTION 'invalid session';
  END IF;
  IF jsonb_typeof(_messages) <> 'array' OR jsonb_array_length(_messages) > 500
     OR octet_length(_messages::text) > 500000 THEN
    RAISE EXCEPTION 'invalid messages';
  END IF;
  IF length(coalesce(_customer_name,'')) > 200 OR length(coalesce(_customer_email,'')) > 255
     OR length(coalesce(_customer_phone,'')) > 50 THEN
    RAISE EXCEPTION 'invalid contact';
  END IF;
  INSERT INTO public.neti_conversations(session_id, customer_name, customer_email, customer_phone, messages, message_count, updated_at)
  VALUES (_session_id, _customer_name, _customer_email, _customer_phone, _messages, jsonb_array_length(_messages), now())
  ON CONFLICT (session_id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name, customer_email = EXCLUDED.customer_email,
    customer_phone = EXCLUDED.customer_phone, messages = EXCLUDED.messages,
    message_count = EXCLUDED.message_count, updated_at = now();
END $$;
REVOKE ALL ON FUNCTION public.save_neti_conversation(text,text,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_neti_conversation(text,text,text,text,jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS "Public create orders" ON public.orders;
CREATE POLICY "Public create manual orders" ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'pending_verification'
  AND payment_provider = 'manual'
  AND payment_reference IS NULL
  AND payment_url IS NULL
  AND availability_request_id IS NULL
  AND total >= 0 AND discount_amount >= 0
  AND length(reference) BETWEEN 4 AND 100
  AND length(customer_name) BETWEEN 1 AND 200
  AND length(customer_email) BETWEEN 3 AND 255
  AND jsonb_typeof(items) = 'array' AND jsonb_array_length(items) BETWEEN 1 AND 200
);