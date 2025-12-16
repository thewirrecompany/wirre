-- Supabase SQL Migration: Add Admin Role
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing role check constraint if it exists
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add new role check constraint that includes 'admin'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('company', 'candidate', 'admin'));

-- Step 3: Create an admin user (update the email to your actual admin email)
-- First, manually sign up via your app or Supabase auth, then run:
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-admin-email@example.com';

-- Step 4: Optional - Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Add RLS policies for admin access
-- Use the is_admin function which is SECURITY DEFINER (bypasses RLS)

-- Allow admins to view all companies
CREATE POLICY "Admins can view all companies"
ON companies FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to view all candidates
CREATE POLICY "Admins can view all candidates"
ON candidates FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- For profiles table, we need a different approach to avoid recursion
-- The is_admin function already uses SECURITY DEFINER so it bypasses RLS
-- We just need to allow users to see their own profile + admins see all
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles via function"
ON profiles FOR SELECT
TO authenticated
USING (
  -- Use a direct check without subquery to avoid recursion
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- IMPORTANT: After running this migration, update your first admin user:
-- 1. Sign up normally through your app
-- 2. Then run: UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
-- 3. Log out and log back in
