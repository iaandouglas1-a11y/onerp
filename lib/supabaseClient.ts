import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase env vars");
  return { supabaseUrl, supabaseAnonKey };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export async function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => { try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} }
    }
  });
}
