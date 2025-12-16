# Admin Role Setup Instructions

## What Was Created

### Frontend Components:
1. **[src/pages/admin/Dashboard.tsx](src/pages/admin/Dashboard.tsx)** - Main admin dashboard showing all companies and candidates
2. **[src/pages/admin/ViewAsCompany.tsx](src/pages/admin/ViewAsCompany.tsx)** - View any company's dashboard
3. **[src/pages/admin/ViewAsCandidate.tsx](src/pages/admin/ViewAsCandidate.tsx)** - View any candidate's dashboard

### Routes Added:
- `/admin/dashboard` - Admin dashboard with tabs for companies/candidates
- `/admin/view-as/company/:userId` - View specific company's dashboard
- `/admin/view-as/candidate/:userId` - View specific candidate's dashboard

### Type Updates:
- Updated `Profile` type to include `'admin'` role in [src/lib/supabase.ts](src/lib/supabase.ts)

---

## How to Set Up

### 1. Run Supabase Migration

Go to your Supabase project → SQL Editor → Run this file:

```sql
-- File: supabase-migration-admin-role.sql

-- Drop existing role check constraint if it exists
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new role check constraint that includes 'admin'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('company', 'candidate', 'admin'));

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for admin access
CREATE POLICY "Admins can view all companies"
ON companies FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view all candidates"
ON candidates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
```

### 2. Create Your First Admin User

**Option A: Via Supabase Dashboard**
1. Sign up normally through your app with your admin email
2. Go to Supabase → Table Editor → `profiles` table
3. Find your user record
4. Edit the `role` column from `company` or `candidate` to `admin`

**Option B: Via SQL**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 3. Test It Out

1. Log out of your current session
2. Log in with the admin account
3. You'll be redirected to `/admin/dashboard`
4. You'll see tabs for Companies and Candidates
5. Click "View as Company" or "View as Candidate" to see their dashboards

---

## Features

### Admin Dashboard
- **Companies Tab**: Lists all registered companies with:
  - Company name
  - Email
  - Domain
  - LinkedIn
  - Join date
  - "View as Company" button

- **Candidates Tab**: Lists all registered candidates with:
  - Full name
  - Email
  - GitHub username (with link)
  - LinkedIn (with link)
  - Join date
  - "View as Candidate" button

### View As Feature
When you click "View as Company" or "View as Candidate":
- A banner appears at the top showing "ADMIN VIEW"
- Shows who you're viewing as
- "Back to Admin" button to return
- Full access to that user's dashboard (read-only by default)

---

## Security Notes

1. **RLS Policies**: The migration adds policies so admins can SELECT from all tables
2. **Protected Routes**: Admin routes require `role = 'admin'` via ProtectedRoute component
3. **Read-Only by Default**: The view-as feature doesn't allow admins to edit user data (you can add this later if needed)

---

## Next Steps (Optional)

### Add Admin Controls
You might want to add admin-specific actions like:
- Approve/reject companies
- Ban users
- Edit user profiles
- Delete assessments
- View analytics

### Add Admin Notifications
Currently, admin doesn't have specific notifications. You can add admin-specific alerts like:
- New company registrations
- New candidate signups
- Assessment submissions
- Payment confirmations

### Add More Views
- Assessment overview (all assessments across all companies)
- Analytics dashboard
- Payment tracking
- System logs

---

## Troubleshooting

**Issue: Can't see admin dashboard after updating role**
- Solution: Log out and log back in (profile is cached in AuthContext)

**Issue: RLS policies blocking admin access**
- Solution: Make sure all three policies were created successfully
- Check if other existing policies are conflicting

**Issue: "View as" pages show empty/loading**
- Solution: Check that the userId parameter is valid
- Verify the user exists in the database

**Issue: Getting redirected after login**
- Solution: Check AuthContext - it should redirect admins to `/admin/dashboard`
