import type { NextRequest } from 'next/server';
import { renovarSessao } from '@/lib/supabase/renovar-sessao';
export async function proxy(requisicao: NextRequest) { return renovarSessao(requisicao); }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)'] };
