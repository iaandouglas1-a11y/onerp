/** Cálculo estimativo para conferência; não substitui guia emitida pelo órgão competente. */
export type DebitoFiscal = {
 id:string;cliente_id:string;descricao:string;tipo_debito:string;numero_referencia:string|null;
 competencia:string|null;vencimento:string;valor_principal:number;
 criterio_atualizacao:'FEDERAL_MORA'|'MANUAL'|'SEM_ATUALIZACAO';
 juros_manual:number;multa_manual:number;data_referencia_manual:string|null;
 situacao:'ABERTO'|'PAGO'|'CANCELADO';data_pagamento:string|null;valor_pago:number|null;observacoes:string|null;
};
export type TaxaSelic={competencia:string;percentual:number};
export type ResumoDebito={multa:number|null;juros:number|null;total:number|null;atrasado:boolean;pendenteIndice:boolean;observacao:string};
const centavos=(valor:number)=>Math.round((valor+Number.EPSILON)*100)/100;
const diaUtc=(data:string)=>Date.parse(`${data.slice(0,10)}T00:00:00Z`);
const mesSeguinte=(mes:string)=>{const [ano,numero]=mes.split('-').map(Number);return new Date(Date.UTC(ano,numero,1)).toISOString().slice(0,7);};

export function calcularDebito(debito:DebitoFiscal,taxas:TaxaSelic[],referencia:string):ResumoDebito{
 const vencimento=debito.vencimento.slice(0,10);
 const dataBase=debito.situacao==='PAGO'&&debito.data_pagamento?debito.data_pagamento.slice(0,10):referencia;
 const atrasado=debito.situacao!=='CANCELADO'&&diaUtc(dataBase)>diaUtc(vencimento);
 const principal=Number(debito.valor_principal);
 if(debito.situacao==='CANCELADO')return {multa:0,juros:0,total:0,atrasado:false,pendenteIndice:false,observacao:'Cancelado'};
 if(debito.situacao==='PAGO')return {multa:null,juros:null,total:debito.valor_pago===null?null:Number(debito.valor_pago),atrasado:false,pendenteIndice:false,observacao:'Valor efetivamente pago'};
 if(!atrasado)return {multa:0,juros:0,total:centavos(principal),atrasado:false,pendenteIndice:false,observacao:'A vencer'};
 if(debito.criterio_atualizacao==='SEM_ATUALIZACAO')return {multa:0,juros:0,total:centavos(principal),atrasado:true,pendenteIndice:false,observacao:'Sem atualização automática por opção do escritório'};
 if(debito.criterio_atualizacao==='MANUAL')return {multa:Number(debito.multa_manual),juros:Number(debito.juros_manual),total:centavos(principal+Number(debito.multa_manual)+Number(debito.juros_manual)),atrasado:true,pendenteIndice:false,observacao:'Acréscimos informados manualmente; confirme a data da guia'};
 const dias=Math.floor((diaUtc(dataBase)-diaUtc(vencimento))/86400000);
 // Regra de mora federal padrão: 0,33% por dia, máximo de 20%.
 const multa=centavos(principal*Math.min(0.20,dias*0.0033));
 if(vencimento.slice(0,7)===dataBase.slice(0,7))return {multa,juros:0,total:centavos(principal+multa),atrasado:true,pendenteIndice:false,observacao:'Estimativa federal: multa, sem juros no mesmo mês'};
 const porMes=new Map(taxas.map(t=>[t.competencia.slice(0,7),Number(t.percentual)]));
 let mes=mesSeguinte(vencimento.slice(0,7));
 let percentual=1; // 1% no mês do pagamento, com Selic de meses anteriores.
 while(mes<dataBase.slice(0,7)){
   const indice=porMes.get(mes);
   if(indice===undefined||!Number.isFinite(indice))return {multa,juros:null,total:null,atrasado:true,pendenteIndice:true,observacao:`Selic de ${mes.slice(5,7)}/${mes.slice(0,4)} não cadastrada; total indisponível`};
   percentual+=indice;
   mes=mesSeguinte(mes);
 }
 const juros=centavos(principal*percentual/100);
 return {multa,juros,total:centavos(principal+multa+juros),atrasado:true,pendenteIndice:false,observacao:'Estimativa federal: confirmar com guia oficial'};
}

export function consolidarDebitos(debitos:DebitoFiscal[],taxas:TaxaSelic[],referencia:string){
 const ativos=debitos.filter(d=>d.situacao==='ABERTO');
 const vencidos=ativos.filter(d=>d.vencimento.slice(0,10)<referencia);
 const vencer=ativos.filter(d=>d.vencimento.slice(0,10)>=referencia);
 const soma=(itens:DebitoFiscal[])=>centavos(itens.reduce((total,d)=>total+Number(d.valor_principal),0));
 const calculados=ativos.map(d=>calcularDebito(d,taxas,referencia));
 const incompletos=calculados.filter(r=>r.total===null).length;
 return {totalPrincipal:soma(ativos),vencidoPrincipal:soma(vencidos),vencerPrincipal:soma(vencer),
  totalAtualizado:incompletos?null:centavos(calculados.reduce((total,r)=>total+(r.total??0),0)),incompletos,
  quantidade:ativos.length,quantidadeVencidos:vencidos.length,quantidadeVencer:vencer.length};
}
