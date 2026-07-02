import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Supabase is optional. When VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
// absent the app runs entirely on bundled seed data — services check
// `supabase === null` and fall back. Only the anon (publishable) key belongs
// here; RLS policies in supabase/migrations are what protect the data.

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient<Database> | null =
  url && anonKey ? createClient<Database>(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;
