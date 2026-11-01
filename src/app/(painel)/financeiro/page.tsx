import Link from 'next/link';
import {CabecalhoPagina,Cartao,Indicador,Etiqueta,ListaVazia} from '@/componentes/globais/elementos';
import {carregarFinanceiro} from '@/modulos/financeiro/consultas';
import {resumoFinanceiro,saldoRecebivel} from '@/modulos/financeiro/calculos';
import {moeda,mesAtual,dataBrasileira,formatarCompetencia} from '@/lib/utilitarios/formatacao';
const hoje=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export default async function PaginaFinanceiro(){
 const dados=await carregarFinanceiro();const mes=mesAtual();const indicadores=resumoFinanceiro(dados,mes,hoje());
 const clientes=new Map(dados.clientes.map(c=>[c.id,c.razao_social]));
 const pendentes=dados.receber.filter(r=>r.situacao!=='CANCELADO'&&saldoRecebivel(r,dados.recebimentos).saldo>0).sort((a,b)=>a.data_vencimento.localeCompare(b.data_vencimento)).slice(0,8);
 const recentes=[...dados.movimentos].sort((a,b)=>b.data_movimento.localeCompare(a.data_movimento)).slice(0,8);
 return <><CabecalhoPagina titulo="Financeiro" descricao={`Gestão financeira interna da On Contabilidade · ${formatarCompetencia(mes)}`}/>
 <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Recebido no mês" valor={moeda(indicadores.receitas)}/><Indicador legenda="Pago no mês" valor={moeda(indicadores.despesas)}/><Indicador legenda="Resultado de caixa" valor={moeda(indicadores.resultado)}/><Indicador legenda="Saldo disponível" valor={moeda(indicadores.saldoTotal)}/></div>
 <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Contas a receber" valor={moeda(indicadores.emAberto)}/><Indicador legenda="Inadimplência vencida" valor={moeda(indicadores.vencidos)}/><Indicador legenda="Contas a pagar" valor={moeda(indicadores.contasPagar)}/><Indicador legenda="Honorários recorrentes ativos" valor={moeda(indicadores.honorariosRecorrentes)} detalhe="Valor mensal contratado; não é recebido"/></div>
 <div className="linha" style={{marginBottom:17,flexWrap:'wrap'}}><Link className="botao primario" href="/financeiro/recebimentos?modal=cobranca">Nova cobrança</Link><Link className="botao" href="/financeiro/honorarios?modal=gerar">Gerar honorários do mês</Link><Link className="botao" href="/financeiro/despesas?modal=despesa">Nova despesa</Link><Link className="botao" href="/financeiro/relatorios">Relatórios</Link></div>
 <div className="grade colunas-2"><Cartao titulo="Cobranças próximas e vencidas" acoes={<Link href="/financeiro/recebimentos" className="botao">Ver todas</Link>}>
 {pendentes.length===0?<ListaVazia texto="Nenhuma cobrança em aberto."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente</th><th>Vencimento</th><th>Saldo</th><th>Situação</th></tr></thead><tbody>{pendentes.map(r=><tr key={r.id}><td>{clientes.get(r.cliente_id)||'—'}</td><td>{dataBrasileira(r.data_vencimento)}</td><td>{moeda(saldoRecebivel(r,dados.recebimentos).saldo)}</td><td><Etiqueta valor={r.data_vencimento<hoje()?'VENCIDO':r.situacao}/></td></tr>)}</tbody></table></div>}</Cartao>
 <Cartao titulo="Últimas movimentações" acoes={<Link href="/financeiro/movimentacoes" className="botao">Ver extrato</Link>}>
 {recentes.length===0?<ListaVazia texto="Nenhuma movimentação registrada."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Data</th><th>Histórico</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>{recentes.map(m=><tr key={m.id}><td>{dataBrasileira(m.data_movimento)}</td><td>{m.descricao||'—'}</td><td><Etiqueta valor={m.tipo}/></td><td>{moeda(m.valor)}</td></tr>)}</tbody></table></div>}</Cartao></div>
 </>;
}
