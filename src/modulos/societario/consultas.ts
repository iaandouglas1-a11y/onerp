import 'server-only';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import type { Cliente } from '@/tipos/modelos';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
export async function listarClientes() {
  const {banco,escritorioId}=await exigirEscritorio();
  return consultarTodasPaginas<Cliente>((inicio,fim)=>banco.from('clientes').select('*').eq('escritorio_id',escritorioId).order('id').range(inicio,fim));
}
export async function buscarCliente(id:string) {
  const {banco,escritorioId}=await exigirEscritorio();
  const {data,error:erro}=await banco.from('clientes').select('*').eq('escritorio_id',escritorioId).eq('id',id).maybeSingle();
  if(erro)throw new Error(`Consultar cliente: ${erro.message}`);
  return data as Cliente|null;
}
export async function registrosCliente(tabela:string,id:string) {
  const {banco,escritorioId}=await exigirEscritorio();
  // Esta função somente é utilizada pelo servidor; a tabela é escolhida pelo switch controlado no componente.
  const permitidas=new Set(['enderecos_clientes','contatos_clientes','representantes_clientes','servicos_clientes','documentos','observacoes_clientes','obrigacoes_clientes','tarefas','itens_implantacao_clientes']);
  if(!permitidas.has(tabela))throw new Error('Tabela não autorizada.');
  const {data,error:erro}=await banco.from(tabela).select('*').eq('escritorio_id',escritorioId).eq('cliente_id',id);
  if(erro)throw new Error(`Consultar registros: ${erro.message}`);
  return (data??[]) as Record<string, unknown>[];
}
