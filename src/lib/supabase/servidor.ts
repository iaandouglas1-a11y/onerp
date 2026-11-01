import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function criarClienteServidor() {
  const armazenamento = await cookies();
  const endereco = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!endereco || !chave) throw new Error('Configure as variáveis públicas do Supabase no ambiente.');
  return createServerClient(endereco, chave, {
    cookies: {
      getAll() { return armazenamento.getAll(); },
      setAll(itens) {
        try { itens.forEach(({ name: nome, value: valor, options: opcoes }) => armazenamento.set(nome, valor, opcoes)); }
        catch { /* Em Server Components, o proxy gerencia a renovação da sessão. */ }
      },
    },
  });
}
