import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function criarClienteAdministrador() {
  const endereco = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!endereco || !chave) throw new Error('Serviço restrito não configurado.');
  return createClient(endereco, chave, { auth: { persistSession: false, autoRefreshToken: false } });
}
