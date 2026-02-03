-- Enable RLS on waitlist table
ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts to waitlist
CREATE POLICY "Allow anonymous inserts to waitlist"
ON "public"."waitlist"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own entries (optional, but good practice)
-- But mostly we just need insert for now. 
