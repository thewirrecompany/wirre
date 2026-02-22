ALTER TABLE public.candidates
ADD COLUMN username text UNIQUE,
ADD COLUMN is_public boolean DEFAULT false;
