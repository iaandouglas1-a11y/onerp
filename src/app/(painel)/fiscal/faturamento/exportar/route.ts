import { NextRequest,NextResponse } from 'next/server';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { mesValido } from '@/lib/utilitarios/formatacao';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
/** Exportação somente leitura e nunca em cache. Campos recebem proteção contra fórmulas em planilhas. */
function campoCsv(valor:unknown){const texto=String(valor??'');const seguro=/^[=+@\-\t\r]/.test(texto)?`'${texto}`:texto;return `"${seguro.replaceAll('"','""')}"`;}
export async function GET(requisicao:NextRequest){
  const {banco,escritorioId}=await exigirEscritorio();const url=new URL(requisicao.url);const mes=mesValido(url.searchParams.get('competencia'));
  const tipo=url.searchParams.get('tipo');const [movimentos,clientes]=await Promise.all([
    consultarTodasPaginas<{cliente_id:string;competencia:string;data_movimento:string;tipo_movimento:string;atividade_receita:string|null;descricao:string|null;numero_documento:string|null;valor:number}>((inicio,fim)=>banco.from('movimentacoes_fiscais')
      .select('cliente_id,competencia,data_movimento,tipo_movimento,atividade_receita,descricao,numero_documento,valor').eq('escritorio_id',escritorioId)
      .eq('competencia',`${mes}-01`).order('id').range(inicio,fim)),
    consultarTodasPaginas<{id:string;razao_social:string;cpf_cnpj:string;regime_tributario:string|null}>((inicio,fim)=>banco.from('clientes')
      .select('id,razao_social,cpf_cnpj,regime_tributario').eq('escritorio_id',escritorioId).order('id').range(inicio,fim)),
  ]);
  const nomes=Object.fromEntries(clientes.map(item=>[item.id,item]));
  const registros=movimentos.filter(item=>tipo!=='convencional'||nomes[item.cliente_id]?.regime_tributario!=='MEI');
  const linhas=[['Cliente','CPF/CNPJ','Regime','Competência','Data','Tipo','Atividade','Descrição','Documento','Valor (R$)'],...registros.map(item=>[nomes[item.cliente_id]?.razao_social??'',nomes[item.cliente_id]?.cpf_cnpj??'',nomes[item.cliente_id]?.regime_tributario??'',item.competencia,item.data_movimento,item.tipo_movimento,item.atividade_receita??'',item.descricao??'',item.numero_documento??'',Number(item.valor).toFixed(2).replace('.',',')])];
  const conteudo='\uFEFF'+linhas.map(linha=>linha.map(campoCsv).join(';')).join('\r\n');
  return new NextResponse(conteudo,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="faturamento-${mes}.csv"`,'Cache-Control':'no-store, private'}});
}
