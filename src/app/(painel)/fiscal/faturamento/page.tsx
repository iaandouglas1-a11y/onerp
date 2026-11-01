import Link from 'next/link';
import { CabecalhoPagina, Cartao, Indicador, Etiqueta, SeletorMes, ListaVazia } from '@/componentes/globais/elementos';
import { resumoFaturamento } from '@/modulos/fiscal/consultas';
import { ModalMovimento } from '@/modulos/fiscal/componentes/modal-movimento';
import { AcoesMovimento } from '@/modulos/fiscal/componentes/acoes-movimento';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { moeda } from '@/lib/utilitarios/formatacao';
export default async function Faturamento({searchParams}:{searchParams:Promise<{competencia?:string;novo?:string;editar?:string;cliente?:string}>}){
  const filtros=await searchParams;
  const [{mes,clientes,movimentos},contexto]=await Promise.all([resumoFaturamento(filtros.competencia),exigirEscritorio()]);
  const meis=clientes.filter(item=>item.regime_tributario==='MEI');const convencionais=clientes.filter(item=>item.regime_tributario!=='MEI');
  const nomes=Object.fromEntries(clientes.map(item=>[item.id,item]));
  const receitaMei=movimentos.filter(item=>item.tipo_movimento==='RECEITA'&&nomes[item.cliente_id]?.regime_tributario==='MEI').reduce((soma,item)=>soma+Number(item.valor),0);
  const receitaConvencional=movimentos.filter(item=>item.tipo_movimento==='RECEITA'&&nomes[item.cliente_id]?.regime_tributario!=='MEI').reduce((soma,item)=>soma+Number(item.valor),0);
  const podeEditar=contexto.perfilAcesso!=='viewer';
  const base=`/fiscal/faturamento?competencia=${mes}`;
  return <><CabecalhoPagina titulo="Faturamento mensal" descricao="Visão integrada das receitas dos clientes MEI e convencionais." acao={podeEditar?'Novo lançamento':undefined} rotaAcao={`${base}&novo=1`}/>
    <div className="filtros"><SeletorMes mes={mes} base="/fiscal/faturamento"/><Link className="botao" href={`/fiscal/faturamento/exportar?competencia=${mes}&tipo=todos`}>Exportar relatório CSV</Link></div>
    <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Receitas do mês" valor={moeda(receitaMei+receitaConvencional)}/><Indicador legenda="Receitas MEI" valor={moeda(receitaMei)} detalhe={`${meis.length} cliente(s) MEI`}/><Indicador legenda="Receitas convencionais" valor={moeda(receitaConvencional)} detalhe={`${convencionais.length} cliente(s)`}/><Indicador legenda="Lançamentos do mês" valor={movimentos.length}/></div>
    <div className="grade colunas-2" style={{marginBottom:16}}><Cartao titulo="Faturamento MEI" acoes={<Link href="/fiscal/faturamento/mei" className="botao primario">Acompanhar</Link>}><p className="muted pequeno">Receitas por competência, acumulado anual e limite parametrizado.</p><h2 style={{fontSize:24,marginTop:15}}>{moeda(receitaMei)}</h2></Cartao><Cartao titulo="Faturamento convencional" acoes={<Link href="/fiscal/faturamento/convencional" className="botao primario">Consultar</Link>}><p className="muted pequeno">Receitas separadas de entradas e despesas.</p><h2 style={{fontSize:24,marginTop:15}}>{moeda(receitaConvencional)}</h2></Cartao></div>
    <Cartao titulo="Movimentações do período">{movimentos.length===0?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente</th><th>Movimento</th><th>Atividade</th><th>Descrição</th><th>Valor</th><th style={{textAlign:'right'}}>Ações</th></tr></thead><tbody>{movimentos.map(item=><tr key={item.id}><td>{nomes[item.cliente_id]?.razao_social||'Cliente'}</td><td><Etiqueta valor={item.tipo_movimento}/></td><td>{item.atividade_receita||'—'}</td><td>{item.descricao||'—'}</td><td>{moeda(item.valor)}</td><td><AcoesMovimento id={item.id} clienteId={item.cliente_id} base={base} origem={item.origem} permitirEdicao={podeEditar} permitirExclusao={contexto.perfilAcesso==='owner'||contexto.perfilAcesso==='admin'}/></td></tr>)}</tbody></table></div>}</Cartao>
    <ModalMovimento novo={filtros.novo} editar={filtros.editar} clienteSelecionado={filtros.cliente} fecharEm={base}/>
  </>;
}
