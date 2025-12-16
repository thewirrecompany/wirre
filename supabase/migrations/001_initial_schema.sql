-- Phase 1: Auth & Basic Profiles

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  role text not null check (role in ('company', 'candidate')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Companies table (only for company users)
create table companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  name text not null,
  domain text,
  linkedin_url text,
  created_at timestamp with time zone default now()
);

-- Candidates table (only for candidate users)
create table candidates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade unique not null,
  full_name text not null,
  github_username text,
  linkedin_url text,
  created_at timestamp with time zone default now()
);

-- Row Level Security Policies

-- Profiles: users can read their own profile
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Companies: only company users can manage their data
alter table companies enable row level security;

create policy "Companies can read own data"
  on companies for select
  using (auth.uid() = user_id);

create policy "Companies can insert own data"
  on companies for insert
  with check (auth.uid() = user_id OR user_id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

create policy "Companies can update own data"
  on companies for update
  using (auth.uid() = user_id);

-- Candidates: only candidates can manage their data
alter table candidates enable row level security;

create policy "Candidates can read own data"
  on candidates for select
  using (auth.uid() = user_id);

create policy "Candidates can insert own data"
  on candidates for insert
  with check (auth.uid() = user_id OR user_id IN (SELECT id FROM auth.users WHERE id = auth.uid()));

create policy "Candidates can update own data"
  on candidates for update
  using (auth.uid() = user_id);

-- Function to handle new user creation (creates basic profile)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'candidate');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to complete company signup (bypasses RLS)
create or replace function complete_company_signup(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_domain text default null,
  p_linkedin_url text default null
)
returns json as $$
declare
  v_company_id uuid;
begin
  -- Ensure profile exists and has correct role
  insert into public.profiles (id, email, role)
  values (p_user_id, p_email, 'company')
  on conflict (id) do update set role = 'company';
  
  -- Create company record
  insert into public.companies (user_id, name, domain, linkedin_url)
  values (p_user_id, p_name, p_domain, p_linkedin_url)
  returning id into v_company_id;
  
  return json_build_object('company_id', v_company_id);
end;
$$ language plpgsql security definer;

-- Function to complete candidate signup (bypasses RLS)
create or replace function complete_candidate_signup(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_github_username text default null
)
returns json as $$
declare
  v_candidate_id uuid;
begin
  -- Ensure profile exists and has correct role
  insert into public.profiles (id, email, role)
  values (p_user_id, p_email, 'candidate')
  on conflict (id) do update set role = 'candidate';
  
  -- Create candidate record
  insert into public.candidates (user_id, full_name, github_username)
  values (p_user_id, p_full_name, p_github_username)
  returning id into v_candidate_id;
  
  return json_build_object('candidate_id', v_candidate_id);
end;
$$ language plpgsql security definer;
