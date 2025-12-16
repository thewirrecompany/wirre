# WIRRE Backend Setup Guide

## Phase 1: Auth & Basic Profiles

This guide will help you set up the Supabase backend for WIRRE.

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name, database password, and region
3. Wait for the project to be provisioned (~2 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under Project URL)
   - **anon/public key** (under Project API keys)

### 3. Configure Environment Variables

1. Create a `.env` file in the root of your project:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

### 4. Run the Database Migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- **profiles** table (extends auth.users with role)
- **companies** table (for company users)
- **candidates** table (for candidate users)
- Row Level Security (RLS) policies
- Trigger to auto-create profiles on signup

### 5. Verify the Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see three new tables: `profiles`, `companies`, `candidates`
3. Go to **Authentication** → **Policies** to see the RLS policies

### 6. Test the Application

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/signup`
3. Create a test account (either company or candidate)
4. Check your email for verification (if enabled)
5. Login with your credentials

### Database Schema Overview

**profiles**
- `id` (uuid, PK, FK to auth.users)
- `email` (text, unique)
- `role` (text: 'company' or 'candidate')
- `created_at`, `updated_at`

**companies** (only for company users)
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles.id)
- `name` (text)
- `domain` (text, nullable)
- `linkedin_url` (text, nullable)
- `created_at`

**candidates** (only for candidate users)
- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles.id)
- `full_name` (text)
- `github_username` (text, nullable)
- `created_at`

### Security

- All tables have Row Level Security (RLS) enabled
- Users can only read/update their own data
- Role-based access control through the `profiles.role` column
- Protected routes ensure company users can't access candidate dashboards and vice versa

### Next Steps

After Phase 1 is working, we'll add:
- Phase 2: Repositories and assessments
- Phase 3: Evaluation and scoring
- Phase 4: Analytics and reporting
