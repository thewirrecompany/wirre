import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Configure client to avoid persisting auth sessions to localStorage
// This reduces risk of session tokens being leaked via Inspect Element
// Persist sessions in browser storage (login remains across reloads).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // disable session detection in URL to avoid leaking tokens via URLs
    detectSessionInUrl: false,
  },
});

export type Profile = {
  id: string;
  email: string;
  role: 'company' | 'candidate' | 'admin';
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
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
