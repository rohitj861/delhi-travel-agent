CREATE TABLE public.travel_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX travel_queries_user_created_idx ON public.travel_queries (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.travel_queries TO authenticated;
GRANT ALL ON public.travel_queries TO service_role;

ALTER TABLE public.travel_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own travel queries"
  ON public.travel_queries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own travel queries"
  ON public.travel_queries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own travel queries"
  ON public.travel_queries FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own travel queries"
  ON public.travel_queries FOR DELETE TO authenticated
  USING (auth.uid() = user_id);