-- Complete fix for admin RLS policies
-- Run this entire script in Supabase SQL Editor

-- Step 1: Drop ALL existing policies that might cause issues
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles via function" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

DROP POLICY IF EXISTS "Admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Companies and admins can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;

DROP POLICY IF EXISTS "Admins can view all candidates" ON candidates;
DROP POLICY IF EXISTS "Candidates and admins can view candidates" ON candidates;
DROP POLICY IF EXISTS "Admins can update candidates" ON candidates;

-- Step 2: Recreate the is_admin function (in case it doesn't exist or needs update)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create new policies using is_admin function (no recursion)

-- Profiles: Users can view their own OR if they are admin
CREATE POLICY "Users and admins can view profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR 
  is_admin(auth.uid())
);

-- Companies: Users can view their own company OR if they are admin
CREATE POLICY "Companies and admins can view companies"
ON companies FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  is_admin(auth.uid())
);

-- Candidates: Users can view their own candidate OR if they are admin  
CREATE POLICY "Candidates and admins can view candidates"
ON candidates FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  is_admin(auth.uid())
);

-- Step 4: Add UPDATE policies for admin to actually edit data
CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update companies"
ON companies FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update candidates"
ON candidates FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));
