import { createClient } from "@supabase/supabase-js";

/* ──────────────────────────────────────────────────
   Server-Only Supabase Client
   
   Uses service_role key → bypasses RLS.
   ONLY import this in API routes and server actions.
   NEVER expose to the client / browser.
   ────────────────────────────────────────────────── */

if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL env variable");
}
if (!process.env.SUPABASE_SECRET_ROLE) {
  throw new Error("Missing SUPABASE_SECRET_ROLE env variable");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
