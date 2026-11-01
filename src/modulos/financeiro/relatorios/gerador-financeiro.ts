import 'server-only';
import {gerarRelatorioPdf,type RelatorioPdf} from '@/modulos/fiscal/relatorios/gerador-pdf';
import {moeda,formatarCompetencia,dataBrasileira} from '@/lib/utilitarios/formatacao';
import {mesesAno,projecaoMensal,saldoRecebivel} from '../calculos';
import type {DadosFinanceiros} from '../modelos';
export async function gerarPdfFinanceiro(dados:DadosFinanceiros,ano:number,nomeEscritorio:string){
 const clientes=new Map(dados.clientes.map(c=>[c.id,c.razao_social]));
 const categorias=new Map(dados.categorias.map(c=>[c.id,c.nome]));
 const servicos=new Map(dados.servicos.map(s=>[s.id,s.nome]));
 const meses=mesesAno(ano).map(m=>projecaoMensal(dados,m));
 const receitas=meses.reduce((s,m)=>s+m.receitas,0),despesas=meses.reduce((s,m)=>s+m.despesas,0);
 const pendentes=dados.receber.filter(r=>r.situacao!=='CANCELADO'&&saldoRecebivel(r,dados.recebimentos).saldo>0&&r.data_vencimento.slice(0,4)===String(ano));
 const porCategoria=new Map<string,{receita:number;despesa:number}>();
 for(const item of dados.movimentos.filter(m=>m.tipo!=='TRANSFERENCIA'&&m.data_movimento.slice(0,4)===String(ano))){
  const nome=categorias.get(item.categoria_id||'')||'Sem categoria';const grupo=porCategoria.get(nome)||{receita:0,despesa:0};
  if(item.tipo==='RECEITA')grupo.receita+=Number(item.valor);else grupo.despesa+=Number(item.valor);
  porCategoria.set(nome,grupo);
 }
 const porServico=new Map<string,number>();
 for(const c of dados.receber.filter(r=>r.competencia?.slice(0,4)===String(ano)&&r.situacao!=='CANCELADO')){
  const contrato=dados.honorarios.find(h=>h.id===c.contrato_honorarios_id);
  const nome=contrato?servicos.get(contrato.servico_id||'')||'Honorário sem serviço':'Cobrança avulsa';
  porServico.set(nome,(porServico.get(nome)||0)+Number(c.valor));
 }
 const conteudo:RelatorioPdf={
  titulo:'Relatório financeiro gerencial',subtitulo:`Exercício ${ano} · Valores em reais`,orientacao:'paisagem',
  identificacao:[['Escritório',nomeEscritorio],['Exercício',String(ano)]],
  indicadores:[['Recebimentos realizados',moeda(receitas)],['Pagamentos realizados',moeda(despesas)],['Resultado de caixa',moeda(receitas-despesas)],['Cobranças pendentes com vencimento no exercício',moeda(pendentes.reduce((s,r)=>s+saldoRecebivel(r,dados.recebimentos).saldo,0))]],
  tabelas:[
   {titulo:'Comparativo mensal de caixa e previsão',colunas:[{titulo:'Mês',largura:1},{titulo:'Recebido',largura:1,alinhamento:'direita'},{titulo:'Pago',largura:1,alinhamento:'direita'},{titulo:'Resultado realizado',largura:1.2,alinhamento:'direita'},{titulo:'A receber',largura:1,alinhamento:'direita'},{titulo:'A pagar',largura:1,alinhamento:'direita'}],linhas:meses.map(m=>[formatarCompetencia(m.mes),moeda(m.receitas),moeda(m.despesas),moeda(m.realizado),moeda(m.receber),moeda(m.pagar)])},
   {titulo:'Receitas e despesas por categoria',colunas:[{titulo:'Categoria',largura:3},{titulo:'Receitas',largura:1,alinhamento:'direita'},{titulo:'Despesas',largura:1,alinhamento:'direita'}],linhas:[...porCategoria.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([nome,g])=>[nome,moeda(g.receita),moeda(g.despesa)])},
   {titulo:'Cobranças por serviço',colunas:[{titulo:'Serviço',largura:3},{titulo:'Total emitido',largura:1,alinhamento:'direita'}],linhas:[...porServico.entries()].map(([nome,v])=>[nome,moeda(v)])},
   {titulo:'Cobranças pendentes com vencimento no exercício',colunas:[{titulo:'Cliente',largura:2},{titulo:'Cobrança',largura:2},{titulo:'Vencimento',largura:1},{titulo:'Saldo',largura:1,alinhamento:'direita'}],linhas:pendentes.map(c=>[clientes.get(c.cliente_id)||'—',c.descricao,dataBrasileira(c.data_vencimento),moeda(saldoRecebivel(c,dados.recebimentos).saldo)])},
  ],
  observacoes:['Regime de caixa: somente movimentações efetivas. Transferências internas são excluídas do resultado.', 'Previsão: considera apenas cobranças e contas a pagar cadastradas. Honorários futuros não gerados não entram na projeção.'],
 };
 return gerarRelatorioPdf(conteudo);
}
