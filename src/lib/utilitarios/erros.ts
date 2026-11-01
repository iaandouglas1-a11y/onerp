import { redirect } from 'next/navigation';
export function erroNaRota(destino: string, mensagem: string): never {
  const separador = destino.includes('?') ? '&' : '?';
  redirect(`${destino}${separador}erro=${encodeURIComponent(mensagem)}`);
}
export function conferirErro(erro: { message: string } | null, rotulo = 'Operação') {
  if (erro) throw new Error(`${rotulo}: ${erro.message}`);
}
