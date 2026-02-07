import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logs to identify if variables are missing in production
console.log("Debug: VITE_SUPABASE_URL exists?", !!supabaseUrl);
console.log("Debug: VITE_SUPABASE_ANON_KEY exists?", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables! Check .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
