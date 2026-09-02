CREATE TABLE public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('hour', now()),
  request_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_key, window_start)
);

GRANT ALL ON public.ai_rate_limits TO service_role;

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: anon/authenticated have no access at all; only service_role (which bypasses RLS) may use it.

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ai_rate_limits_updated_at
BEFORE UPDATE ON public.ai_rate_limits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit(_bucket_key text, _limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
  _window timestamptz := date_trunc('hour', now());
BEGIN
  INSERT INTO public.ai_rate_limits (bucket_key, window_start, request_count)
  VALUES (_bucket_key, _window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = public.ai_rate_limits.request_count + 1
  RETURNING request_count INTO _count;

  DELETE FROM public.ai_rate_limits WHERE window_start < now() - interval '1 day';

  RETURN _count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(text, integer) TO service_role;