import { createClient } from "@supabase/supabase-js";

// TODO: Replace with your Supabase project credentials
// Find these at: https://supabase.com → Your Project → Settings → API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL 
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
