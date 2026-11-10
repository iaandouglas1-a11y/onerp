import 'server-only';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { mesValido, primeiroDiaMes } from '@/lib/utilitarios/formatacao';
import type { Cliente, MovimentoFiscal } from '@/tipos/modelos';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
export async function resumoFaturamento(mesInformado?:string) {
  const {banco,escritorioId}=await exigirEscritorio();const mes=mesValido(mesInformado);
  const [clientes,movimentos]=await Promise.all([
    consultarTodasPaginas<Cliente>((inicio,fim)=>banco.from('clientes').select('*').eq('escritorio_id',escritorioId).order('id').range(inicio,fim)),
    consultarTodasPaginas<MovimentoFiscal>((inicio,fim)=>banco.from('movimentacoes_fiscais').select('*').eq('escritorio_id',escritorioId)
      .eq('competencia',primeiroDiaMes(mes)).order('id').range(inicio,fim)),
  ]);
  return {mes,clientes,movimentos};
}
