/** Referências quantitativas da folha mensal CLT.
 * DIAS: salário mensal/30 (faltas/DSR).
 * HORAS: salário mensal/divisor contratual; extras multiplicam pelo adicional.
 * VALOR: montante informado, sem inferir bases especiais.
 * As opções e percentuais vêm do catálogo versionável da empresa.
 */
export type ReferenciaEvento = 'DIAS' | 'HORAS' | 'VALOR';
export type ConfiguracaoReferencia = { tipo_referencia?: string; percentual_adicional?: number; divisor_dias?: number };
export type EntradaCalculoEvento = {
 codigo: string; tipo_referencia: ReferenciaEvento; quantidade_referencia?: number | null;
 valor_informado?: number | null; salario: number; divisor_horas_mensais?: number | null;
 configuracao?: ConfiguracaoReferencia;
};
export function arredondarEvento(valor:number){return Math.round((valor+1e-9)*100)/100;}
export function referenciaDoEvento(configuracao:ConfiguracaoReferencia | Record<string,unknown>):ReferenciaEvento{
 const tipo=configuracao?.tipo_referencia;
 return tipo==='DIAS'||tipo==='HORAS'?tipo:'VALOR';
}
export function calcularEventoVariavel(entrada:EntradaCalculoEvento): {valor:number;referencia:string;valor_unitario:number|null}{
 const {codigo,tipo_referencia,configuracao={}}=entrada;
 if(!Number.isFinite(entrada.salario)||entrada.salario<=0)throw new Error('Salário contratual inválido.');
 if(tipo_referencia==='VALOR'){
   const valor=entrada.valor_informado;
   if(valor==null||!Number.isFinite(valor)||valor<0)throw new Error('Informe um valor monetário não negativo.');
   return {valor:arredondarEvento(valor),referencia:'',valor_unitario:null};
 }
 const quantidade=entrada.quantidade_referencia;
 if(quantidade==null||!Number.isFinite(quantidade)||quantidade<=0||quantidade>744)
   throw new Error(`Informe uma quantidade válida de ${tipo_referencia==='DIAS'?'dias':'horas'}.`);
 if(tipo_referencia==='DIAS'&&quantidade>30)throw new Error('Quantidade de dias não pode exceder 30 neste cálculo mensal.');
 const divisor=tipo_referencia==='DIAS'?Number(configuracao.divisor_dias??30):Number(entrada.divisor_horas_mensais);
 if(!Number.isFinite(divisor)||divisor<=0||divisor>400)throw new Error('Configure o divisor de horas mensais no cadastro do empregado antes de lançar eventos em horas.');
 const adicional=tipo_referencia==='HORAS'?Number(configuracao.percentual_adicional??0):0;
 if(!Number.isFinite(adicional)||adicional<0||adicional>300)throw new Error('Percentual adicional inválido.');
 const unitario=entrada.salario/divisor*(1+adicional/100);
 return {valor:arredondarEvento(unitario*quantidade),valor_unitario:arredondarEvento(unitario),
   referencia:`${String(quantidade).replace('.',',')}${tipo_referencia==='DIAS'?'d':'h'}${adicional?` (${adicional}%)`:''}`};
}
