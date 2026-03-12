import { createClient } from '@supabase/supabase-js';

// -------------------------------------------------------
// Supabase Client Setup
// -------------------------------------------------------
// We read the Supabase URL and anonymous key from environment
// variables. Vite exposes env vars prefixed with VITE_ through
// import.meta.env so they are available at build time.
//
// To configure these values, create a `.env` file in the project
// root with the following entries:
//   VITE_SUPABASE_URL=https://your-project.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-key
// -------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export a single Supabase client instance that the
// entire app will share for database queries and auth.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
