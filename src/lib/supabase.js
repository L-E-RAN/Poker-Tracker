import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // Surface misconfig early instead of cryptic network errors.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY env vars.');
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const TRIAL_DAYS = Number(import.meta.env.VITE_TRIAL_DAYS || 30);
export const PRICE_ILS = Number(import.meta.env.VITE_PRICE_ILS || 10);
