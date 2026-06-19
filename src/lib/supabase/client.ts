import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;
let initAttempted = false;

export function getSupabaseBrowserClient() {
  if (initAttempted) return supabaseClient;

  initAttempted = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    supabaseClient = null;
    return null;
  }

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}
