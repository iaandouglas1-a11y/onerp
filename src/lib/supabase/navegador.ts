'use client';
import { createBrowserClient } from '@supabase/ssr';
export function criarClienteNavegador() {
  const endereco = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!endereco || !chave) throw new Error('Supabase não configurado.');
  return createBrowserClient(endereco, chave);
}
