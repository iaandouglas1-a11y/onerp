import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function renovarSessao(requisicao: NextRequest) {
  let resposta = NextResponse.next({ request: requisicao });
  const endereco = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!endereco || !chave) return resposta;
  const cliente = createServerClient(endereco, chave, {
    cookies: {
      getAll() { return requisicao.cookies.getAll(); },
      setAll(itens) {
        itens.forEach(({name: nome, value: valor}) => requisicao.cookies.set(nome, valor));
        resposta = NextResponse.next({ request: requisicao });
        itens.forEach(({name: nome, value: valor, options: opcoes}) => resposta.cookies.set(nome, valor, opcoes));
      },
    },
  });
  await cliente.auth.getUser();
  return resposta;
}
