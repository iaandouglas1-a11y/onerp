import 'server-only';
import { apurarMedias, type FinalidadeMedia, type ResultadoMedias, type ReciboParaMedia, type EventoParaMedia } from './medias';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import type { exigirEscritorio } from '@/lib/seguranca/contexto';

type Banco = Awaited<ReturnType<typeof exigirEscritorio>>['banco'];
export async function mediasEmpregados(banco:Banco,escritorioId:string,clienteId:string,empregados:Array<{id:string;nome_completo:string;data_admissao:string;salario:number;divisor_horas_mensais:number|null}>,
 finalidade:FinalidadeMedia,inicio:string,fim:string):Promise<Map<string,ResultadoMedias>>{
 const [recibos,catalogo]=await Promise.all([
  consultarTodasPaginas<ReciboParaMedia>((a,b)=>banco.from('contracheques_folha')
   .select('id,empregado_id,competencia,situacao,memoria_calculo').eq('escritorio_id',escritorioId)
   .eq('cliente_id',clienteId).gte('competencia',`${inicio}-01`).lte('competencia',`${fim}-01`).order('id').range(a,b)),
  consultarTodasPaginas<EventoParaMedia>((a,b)=>banco.from('eventos_folha').select('codigo,nome,tipo_evento,configuracao_calculo')
   .eq('escritorio_id',escritorioId).order('codigo').range(a,b))
 ]);
 const resultado=new Map<string,ResultadoMedias>();
 for(const empregado of empregados){
  const divisor=Number(empregado.divisor_horas_mensais);
  if(!Number.isFinite(divisor)||divisor<=0)throw Error(`Configure o divisor de horas de ${empregado.nome_completo} antes da apuração de médias.`);
  const salarioHora=Number(empregado.salario)/divisor;
  try{resultado.set(empregado.id,apurarMedias({finalidade,inicio,fim,admissao:empregado.data_admissao,recibos:recibos.filter(r=>r.empregado_id===empregado.id),eventos:catalogo,salarioHoraAtual:salarioHora}));}
  catch(erro){throw Error(`Médias de ${empregado.nome_completo}: ${erro instanceof Error?erro.message:String(erro)}`);}
 }
 return resultado;
}
