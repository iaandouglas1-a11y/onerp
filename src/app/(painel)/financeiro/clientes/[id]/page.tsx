import Link from 'next/link';
import {notFound} from 'next/navigation';
import {CabecalhoPagina,Cartao,Indicador,Etiqueta,ListaVazia} from '@/componentes/globais/elementos';
import {carregarFinanceiro} from '@/modulos/financeiro/consultas';
import {saldoRecebivel} from '@/modulos/financeiro/calculos';
import {moeda,dataBrasileira} from '@/lib/utilitarios/formatacao';
export default async function HistoricoCliente({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const dados=await carregarFinanceiro();const cliente=dados.clientes.find(c=>c.id===id);if(!cliente)notFound();
 const recebiveis=dados.receber.filter(c=>c.cliente_id===id);const recibos=dados.recebimentos.filter(p=>recebiveis.some(r=>r.id===p.conta_receber_id));
 const total=recebiveis.filter(r=>r.situacao!=='CANCELADO').reduce((s,r)=>s+Number(r.valor),0);
 const pago=recibos.reduce((s,r)=>s+Number(r.valor),0);
 return <><CabecalhoPagina titulo={`Financeiro · ${cliente.razao_social}`} descricao="Histórico de honorários, cobranças e recebimentos deste cliente."/>
 <div className="linha" style={{marginBottom:16}}><Link href="/financeiro/recebimentos" className="botao">Voltar às cobranças</Link><Link href="/financeiro/honorarios" className="botao">Honorários recorrentes</Link></div>
 <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Cobranças emitidas" valor={recebiveis.length}/><Indicador legenda="Total emitido" valor={moeda(total)}/><Indicador legenda="Recebido" valor={moeda(pago)}/><Indicador legenda="A receber" valor={moeda(Math.max(0,total-pago))}/></div>
 <Cartao titulo="Cobranças vinculadas">{recebiveis.length===0?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Descrição</th><th>Vencimento</th><th>Valor</th><th>Saldo</th><th>Situação</th></tr></thead><tbody>{recebiveis.map(r=><tr key={r.id}><td>{r.descricao}</td><td>{dataBrasileira(r.data_vencimento)}</td><td>{moeda(r.valor)}</td><td>{moeda(saldoRecebivel(r,dados.recebimentos).saldo)}</td><td><Etiqueta valor={r.situacao}/></td></tr>)}</tbody></table></div>}</Cartao>
 <Cartao titulo="Recebimentos efetuados">{recibos.length===0?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Data</th><th>Referência</th><th>Valor</th></tr></thead><tbody>{recibos.map(r=><tr key={r.id}><td>{dataBrasileira(r.data_pagamento)}</td><td>{recebiveis.find(c=>c.id===r.conta_receber_id)?.descricao||'—'}</td><td>{moeda(r.valor)}</td></tr>)}</tbody></table></div>}</Cartao>
 </>;
}
