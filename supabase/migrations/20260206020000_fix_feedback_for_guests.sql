-- Fix feedback table to allow guest submissions

-- 1. Make user_id and email nullable (optional)
ALTER TABLE public.feedback 
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL;

-- 2. Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;

-- 3. Create new policy that allows anyone (authenticated or anonymous) to insert feedback
CREATE POLICY "Anyone can insert feedback" 
ON public.feedback FOR INSERT 
TO public
WITH CHECK (true);

-- 4. Optional: Add policy for admins to view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'superadmin')
  )
);
