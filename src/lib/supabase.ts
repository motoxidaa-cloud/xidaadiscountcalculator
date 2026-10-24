import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that credentials exist and are not unreplaced placeholders
export const isSupabaseConfigured = (): boolean => {
  if (!rawUrl || !rawKey) return false;
  if (rawUrl.includes('your-project-id') || rawUrl.includes('placeholder')) return false;
  if (!rawUrl.startsWith('https://') && !rawUrl.startsWith('http://')) return false;
  return true;
};

// Fallback dummy URL so createClient does not crash the bundle if keys are unset
const defaultUrl = isSupabaseConfigured() ? rawUrl : 'https://placeholder.supabase.co';
const defaultKey = isSupabaseConfigured() ? rawKey : 'dummy-anon-key-placeholder';

export const supabase: SupabaseClient = createClient(defaultUrl, defaultKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const getSupabaseConfigStatus = () => {
  return {
    configured: isSupabaseConfigured(),
    url: rawUrl ? `${rawUrl.slice(0, 24)}...` : 'Not Set',
  };
};
