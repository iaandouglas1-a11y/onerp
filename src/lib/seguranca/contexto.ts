import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '@/lib/supabase/servidor';

export type PerfilAcesso = 'owner' | 'admin' | 'accountant' | 'analyst' | 'viewer';
export async function exigirUsuario() {
  const banco = await criarClienteServidor();
  const { data: { user: usuario }, error: erro } = await banco.auth.getUser();
  if (erro || !usuario) redirect('/entrar');
  return { banco, usuario };
}
export async function obterContexto() {
  const { banco, usuario } = await exigirUsuario();
  const { data: vinculos, error: erro } = await banco.from('membros_escritorio')
    .select('escritorio_id,perfil_acesso,ativo').eq('usuario_id',usuario.id).eq('ativo',true);
  if (erro) throw new Error('Não foi possível verificar o vínculo com o escritório.');
  const preferencia = (await cookies()).get('on_escritorio_id')?.value;
  const vinculo = vinculos?.find((item) => item.escritorio_id === preferencia) ?? vinculos?.[0] ?? null;
  return { banco, usuario, escritorioId: (vinculo?.escritorio_id as string | undefined) ?? null,
    perfilAcesso: (vinculo?.perfil_acesso as PerfilAcesso | undefined) ?? null };
}
export async function exigirEscritorio() {
  const contexto = await obterContexto();
  if (!contexto.escritorioId) redirect('/configuracao-inicial');
  return { ...contexto, escritorioId: contexto.escritorioId };
}
/** Qualquer membro ativo do escritório pode executar rotinas operacionais. */
export async function exigirEdicao() {
  const contexto = await exigirEscritorio();
  return contexto;
}
export async function exigirAdministrador() {
  const contexto = await exigirEscritorio();
  if (contexto.perfilAcesso !== 'owner' && contexto.perfilAcesso !== 'admin')
    throw new Error('Ação reservada à administração do escritório.');
  return contexto;
}
