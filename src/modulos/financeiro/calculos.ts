import type { DadosFinanceiros, MovimentoFinanceiro, ContaReceber, ContaPagar } from './modelos';
export function arredondar(valor:number){return Math.round((valor+Number.EPSILON)*100)/100;}
export function valorAssinado(movimento:Pick<MovimentoFinanceiro,'tipo'|'valor'|'sentido_transferencia'>):number{
 const valor=Number(movimento.valor);
 return movimento.tipo==='DESPESA'||movimento.tipo==='TRANSFERENCIA'&&movimento.sentido_transferencia==='SAIDA'?-valor:valor;
}
export function saldoConta(conta:{id:string;saldo_inicial:number;data_saldo_inicial:string|null},movimentos:MovimentoFinanceiro[],ate?:string){
 return arredondar(Number(conta.saldo_inicial||0)+movimentos.filter(m=>m.conta_financeira_id===conta.id&&(!ate||m.data_movimento<=ate)&&(!conta.data_saldo_inicial||m.data_movimento>=conta.data_saldo_inicial)).reduce((s,m)=>s+valorAssinado(m),0));
}
export function saldoRecebivel(registro:ContaReceber,recebimentos:DadosFinanceiros['recebimentos']){
 const pago=arredondar(recebimentos.filter(r=>r.conta_receber_id===registro.id).reduce((s,r)=>s+Number(r.valor),0));
 return {pago,saldo:arredondar(Math.max(0,Number(registro.valor)-pago))};
}
export function saldoPagavel(registro:ContaPagar,pagamentos:DadosFinanceiros['pagamentos']){
 const pago=arredondar(pagamentos.filter(r=>r.conta_pagar_id===registro.id).reduce((s,r)=>s+Number(r.valor),0));
 return {pago,saldo:arredondar(Math.max(0,Number(registro.valor)-pago))};
}
export function mesDe(data:string){return data.slice(0,7);}
export function mesesAno(ano:number){return Array.from({length:12},(_,indice)=>`${ano}-${String(indice+1).padStart(2,'0')}`);}
export function resumoFinanceiro(dados:DadosFinanceiros,mes:string,hoje:string){
 const realizados=dados.movimentos.filter(m=>mesDe(m.data_movimento)===mes);
 const receitas=arredondar(realizados.filter(m=>m.tipo==='RECEITA').reduce((s,m)=>s+Number(m.valor),0));
 const despesas=arredondar(realizados.filter(m=>m.tipo==='DESPESA').reduce((s,m)=>s+Number(m.valor),0));
 const emAberto=dados.receber.filter(r=>r.situacao!=='CANCELADO').reduce((s,r)=>s+saldoRecebivel(r,dados.recebimentos).saldo,0);
 const vencidos=dados.receber.filter(r=>r.situacao!=='CANCELADO'&&r.data_vencimento<hoje).reduce((s,r)=>s+saldoRecebivel(r,dados.recebimentos).saldo,0);
 const contasPagar=dados.pagar.filter(r=>r.situacao!=='CANCELADO').reduce((s,r)=>s+saldoPagavel(r,dados.pagamentos).saldo,0);
 const mrr=dados.honorarios.filter(h=>h.ativo).reduce((s,h)=>s+Number(h.valor),0);
 return {receitas,despesas,resultado:arredondar(receitas-despesas),emAberto:arredondar(emAberto),vencidos:arredondar(vencidos),contasPagar:arredondar(contasPagar),honorariosRecorrentes:arredondar(mrr),saldoTotal:arredondar(dados.contas.reduce((s,c)=>s+saldoConta(c,dados.movimentos),0))};
}
export function projecaoMensal(dados:DadosFinanceiros,mes:string){
 const realizados=dados.movimentos.filter(m=>mesDe(m.data_movimento)===mes);
 const receitas=arredondar(realizados.filter(m=>m.tipo==='RECEITA').reduce((s,m)=>s+Number(m.valor),0));
 const despesas=arredondar(realizados.filter(m=>m.tipo==='DESPESA').reduce((s,m)=>s+Number(m.valor),0));
 const receber=arredondar(dados.receber.filter(c=>mesDe(c.data_vencimento)===mes&&c.situacao!=='CANCELADO').reduce((s,c)=>s+saldoRecebivel(c,dados.recebimentos).saldo,0));
 const pagar=arredondar(dados.pagar.filter(c=>mesDe(c.data_vencimento)===mes&&c.situacao!=='CANCELADO').reduce((s,c)=>s+saldoPagavel(c,dados.pagamentos).saldo,0));
 return {mes,receitas,despesas,realizado:arredondar(receitas-despesas),receber,pagar,projetado:arredondar(receitas+receber-despesas-pagar)};
}
export function competenciaPadraoDaData(data:string){return `${data.slice(0,7)}-01`;}
