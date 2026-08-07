/**
 * Path Pal AI - Supabase Service Integrator
 * Handles SDK initialization for Authentication, Database, and Realtime listeners.
 */

// Replace these placeholders with your actual keys from your Supabase Project settings
const supabaseUrl = "https://fuacyuwagehbwijvitny.supabase.co"; // Default project URL from MCP configuration
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY_HERE";

if (typeof supabase === "undefined") {
  console.error("Supabase Web SDK is not loaded. Ensure the CDN script tag is present.");
}

if (!supabaseAnonKey || supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY_HERE")) {
  console.error("Supabase anon key is missing. Please set supabaseAnonKey in js/supabase.js with your public anon key.");
}

const supabaseClient = (typeof supabase !== "undefined" && supabaseAnonKey && !supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY_HERE"))
  ? supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (typeof window !== 'undefined') {
  window.supabaseClient = supabaseClient;
}
