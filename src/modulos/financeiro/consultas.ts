import 'server-only';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import type { DadosFinanceiros } from './modelos';
import { ordenarCadastros, ordenarPorDescricao } from '@/lib/utilitarios/ordenacao';

// As nove consultas seguem o mesmo escritório e paginação sem limite implícito de 1.000 itens.
export async function carregarFinanceiro():Promise<DadosFinanceiros>{
 const {banco,escritorioId}=await exigirEscritorio();
 const consultar=<T>(tabela:string,campos='*')=>consultarTodasPaginas<T>((inicio,fim)=>banco.from(tabela).select(campos).eq('escritorio_id',escritorioId).order('id').range(inicio,fim) as unknown as PromiseLike<{data:T[]|null;error:{message:string}|null}>);
 const [clientes,servicos,categorias,contas,honorarios,receber,pagar,movimentos,recebimentos,pagamentos]=await Promise.all([
  consultar<DadosFinanceiros['clientes'][number]>('clientes','id,razao_social,nome_fantasia,cpf_cnpj,situacao'),
  consultar<DadosFinanceiros['servicos'][number]>('servicos','id,nome,codigo'),
  consultar<DadosFinanceiros['categorias'][number]>('categorias_financeiras'),
  consultar<DadosFinanceiros['contas'][number]>('contas_financeiras'),
  consultar<DadosFinanceiros['honorarios'][number]>('contratos_honorarios'),
  consultar<DadosFinanceiros['receber'][number]>('contas_receber'),
  consultar<DadosFinanceiros['pagar'][number]>('contas_pagar'),
  consultar<DadosFinanceiros['movimentos'][number]>('movimentacoes_financeiras'),
  consultar<DadosFinanceiros['recebimentos'][number]>('recebimentos'),
  consultar<DadosFinanceiros['pagamentos'][number]>('pagamentos_contas_pagar'),
 ]);
 return {clientes:ordenarPorDescricao(clientes,c=>c.razao_social),servicos:ordenarCadastros(servicos,s=>s.codigo,s=>s.nome),categorias:ordenarPorDescricao(categorias,c=>c.nome),contas:ordenarPorDescricao(contas,c=>c.nome),honorarios,receber,pagar,movimentos,recebimentos,pagamentos};
}
