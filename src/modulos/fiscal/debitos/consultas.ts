import 'server-only';
import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {consultarTodasPaginas} from '@/lib/utilitarios/paginacao';
import type {DebitoFiscal,TaxaSelic} from './calculos';
/** Selic acumulada ao mês (SGS 4390, BCB); índices persistidos são contingência.
 * A fonte externa é pública e não recebe identificadores de clientes.
 * Em caso de indisponibilidade, não inventa índices nem apresenta totais incompletos.
 */
async function obterSelicBcb(primeiraCompetencia:string):Promise<TaxaSelic[]>{
 const ano=Math.max(1997,Number(primeiraCompetencia.slice(0,4)));
 const inicio=`01/01/${ano}`;
 const fim=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date());
 const endereco=`https://api.bcb.gov.br/dados/serie/bcdata.sgs.4390/dados?formato=json&dataInicial=${inicio}&dataFinal=${fim}`;
 try{
  const resposta=await fetch(endereco,{next:{revalidate:86400},signal:AbortSignal.timeout(8500),headers:{Accept:'application/json'}});
  if(!resposta.ok)return [];
  const conteudo:unknown=await resposta.json();if(!Array.isArray(conteudo))return [];
  return conteudo.flatMap((item:unknown)=>{
   if(!item||typeof item!=='object')return [];
   const entrada=item as {data?:unknown;valor?:unknown};
   const data=String(entrada.data??'');const valor=Number(String(entrada.valor??'').replace(',','.'));
   const encontrado=data.match(/^\d{2}\/(0[1-9]|1[0-2])\/(\d{4})$/);
   if(!encontrado||!Number.isFinite(valor)||valor<0||valor>100)return [];
   return [{competencia:`${encontrado[2]}-${encontrado[1]}-01`,percentual:valor}];
  });
 }catch{return [];}
}
export type ClienteDebitos={id:string;razao_social:string;cpf_cnpj:string};
export async function consultarDebitosFiscais(clienteId?:string){
 const {banco,escritorioId}=await exigirEscritorio();
 const [clientes,debitos,taxas]=await Promise.all([
  consultarTodasPaginas<ClienteDebitos>((inicio,fim)=>banco.from('clientes').select('id,razao_social,cpf_cnpj').eq('escritorio_id',escritorioId).order('razao_social').range(inicio,fim)),
  consultarTodasPaginas<DebitoFiscal>((inicio,fim)=>{let consulta=banco.from('debitos_fiscais').select('*').eq('escritorio_id',escritorioId);if(clienteId)consulta=consulta.eq('cliente_id',clienteId);return consulta.order('vencimento',{ascending:true}).range(inicio,fim);}),
  consultarTodasPaginas<TaxaSelic>((inicio,fim)=>banco.from('indices_selic_fiscal').select('competencia,percentual').order('competencia').range(inicio,fim))
 ]);
 const maisAntigo=debitos.reduce((data,debito)=>debito.vencimento.slice(0,7)<data?debito.vencimento.slice(0,7):data,'9999-12');
 const bcb=debitos.some(d=>d.criterio_atualizacao==='FEDERAL_MORA')?await obterSelicBcb(maisAntigo==='9999-12'?'2020-01':maisAntigo):[];
 const unicas=new Map(taxas.map(t=>[t.competencia.slice(0,7),t]));
 for(const indice of bcb)unicas.set(indice.competencia.slice(0,7),indice);
 return {clientes,debitos,taxas:[...unicas.values()]};
}
