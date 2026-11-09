"use server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
export async function login(formData: FormData) { const email = String(formData.get("email") ?? ""); const password = String(formData.get("password") ?? ""); const s = await createServerSupabaseClient(); const { error } = await s.auth.signInWithPassword({ email, password }); if (error) redirect("/login?error=Credenciais%20inválidas"); redirect("/dashboard"); }
export async function signup(formData: FormData) { const email = String(formData.get("email") ?? ""); const password = String(formData.get("password") ?? ""); const s = await createServerSupabaseClient(); const { error } = await s.auth.signUp({ email, password }); if (error) redirect("/login?error=Não%20foi%20possível%20criar%20a%20conta"); redirect("/dashboard"); }
export async function logout() { const s = await createServerSupabaseClient(); await s.auth.signOut(); redirect("/login"); }
