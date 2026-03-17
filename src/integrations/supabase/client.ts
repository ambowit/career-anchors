// Supabase client configuration for v0 cloud integration
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Use v0 cloud Supabase environment variables (automatically injected by integration)
const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Export URL and key for debugging
export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
});
