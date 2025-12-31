-- Create waitlist table to capture emails and role (candidate | company)
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('candidate','company')),
  created_at timestamptz default now()
);

grant insert, select on public.waitlist to authenticated;
