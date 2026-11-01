/** Funções puras. Não definem alíquotas, limites ou bases legais. */
export interface RegraLimiteMei { limite_anual: number; proporcional_ano_abertura: boolean; percentual_alerta: number; ano_calendario:number; }
export function limiteEfetivoMei(regra:RegraLimiteMei, dataAbertura:string|null) {
  const limite=Number(regra.limite_anual);
  if(!Number.isFinite(limite)||limite<=0)throw new Error('Limite anual não configurado corretamente.');
  if(!regra.proporcional_ano_abertura||!dataAbertura||Number(dataAbertura.slice(0,4))!==regra.ano_calendario)return limite;
  const mesAbertura=Number(dataAbertura.slice(5,7));
  if(mesAbertura<1||mesAbertura>12)throw new Error('Data de abertura inválida.');
  return Math.round((limite/12)*(13-mesAbertura)*100)/100;
}
export function totalizarReceitas(movimentos: {tipo_movimento:string;valor:number;atividade_receita?:string|null;competencia:string}[], ajustes:{valor:number}[]=[]) {
  const receitas=movimentos.filter(item=>item.tipo_movimento==='RECEITA');
  const somar=(valores:number[])=>Math.round(valores.reduce((total,valor)=>total+Math.round(Number(valor)*100),0))/100;
  // A soma monetária é calculada em centavos para reduzir imprecisões comuns de ponto flutuante.
  const totalCentavos=receitas.reduce((soma,item)=>soma+Math.round(Number(item.valor)*100),0)+ajustes.reduce((soma,item)=>soma+Math.round(Number(item.valor)*100),0);
  return {total:totalCentavos/100,comercio:somar(receitas.filter(item=>item.atividade_receita==='COMERCIO'||item.atividade_receita==='INDUSTRIA').map(item=>Number(item.valor))),servicos:somar(receitas.filter(item=>item.atividade_receita==='SERVICOS').map(item=>Number(item.valor)))};
}
export function situacaoLimite(total:number,limite:number,alerta:number) {
  if(limite<=0)return {percentual:0,situacao:'SEM_REGRA'} as const;
  const percentual=total/limite;
  return {percentual,situacao:percentual>1?'ULTRAPASSADO':percentual>=alerta?'ATENCAO':'REGULAR'} as const;
}
