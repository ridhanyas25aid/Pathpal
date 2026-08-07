import { createClient } from '@supabase/supabase-js';

// Replace these placeholders with your actual keys from your Supabase Dashboard Settings
const supabaseUrl = "https://fuacyuwagehbwijvitny.supabase.co"; // Default URL from project config
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY_HERE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
