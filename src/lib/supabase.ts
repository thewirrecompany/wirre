import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  role: 'company' | 'candidate' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  user_id: string;
  name: string;
  domain: string | null;
  linkedin_url: string | null;
  created_at: string;
};

export type Candidate = {
  id: string;
  user_id: string;
  full_name: string;
  github_username: string | null;
  linkedin_url: string | null;
  created_at: string;
};
