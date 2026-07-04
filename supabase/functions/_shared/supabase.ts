import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export function getSupabase(serviceRole = false) {
  return createClient(
    supabaseUrl,
    serviceRole ? supabaseServiceKey : supabaseAnonKey,
  );
}

export function getSupabaseAdmin() {
  return getSupabase(true);
}
