import Link from 'next/link';
import { CabecalhoPagina, Cartao, Indicador, ListaVazia, Etiqueta, SeletorMes } from '@/componentes/globais/elementos';
import { resumoFaturamento } from '@/modulos/fiscal/consultas';
import { ModalMovimento } from '@/modulos/fiscal/componentes/modal-movimento';
import { AcoesMovimento } from '@/modulos/fiscal/componentes/acoes-movimento';
import { moeda,dataBrasileira } from '@/lib/utilitarios/formatacao';
export default async function Convencional({searchParams}:{searchParams:Promise<{competencia?:string;novo?:string;editar?:string}>}){
  const filtros=await searchParams;
  const {mes,clientes,movimentos}=await resumoFaturamento(filtros.competencia);
  const convencionais=clientes.filter(item=>item.regime_tributario!=='MEI');const ids=new Set(convencionais.map(item=>item.id));const nomes=Object.fromEntries(convencionais.map(item=>[item.id,item.razao_social]));
  const registros=movimentos.filter(item=>ids.has(item.cliente_id));
  const somar=(tipo:string)=>registros.filter(item=>item.tipo_movimento===tipo).reduce((total,item)=>total+Number(item.valor),0);
  const base=`/fiscal/faturamento/convencional?competencia=${mes}`;
  const podeEditar=true; // A autenticação e o vínculo ativo são exigidos no servidor.
  return <><CabecalhoPagina titulo="Faturamento convencional" descricao="Receitas, entradas e despesas de clientes não MEI." acao={podeEditar?'Novo lançamento':undefined} rotaAcao={`${base}&novo=1`}/>
    <div className="filtros"><SeletorMes mes={mes} base="/fiscal/faturamento/convencional"/><Link className="botao" href="/fiscal/categorias">Categorias fiscais</Link><Link className="botao" href={`/fiscal/faturamento/exportar?competencia=${mes}&tipo=convencional`}>Exportar PDF</Link></div>
    <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Receitas" valor={moeda(somar('RECEITA'))}/><Indicador legenda="Entradas" valor={moeda(somar('ENTRADA'))}/><Indicador legenda="Despesas" valor={moeda(somar('DESPESA'))}/><Indicador legenda="Clientes convencionais" valor={convencionais.length}/></div>
    <Cartao titulo="Movimentações do período"><p className="muted pequeno">Entradas e despesas não compõem faturamento nem representam resultado contábil.</p>{!registros.length?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Ações</th><th>Data</th><th>Cliente</th><th>Tipo</th><th>Documento</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>{registros.map(item=><tr key={item.id}><td><AcoesMovimento id={item.id} clienteId={item.cliente_id} base={base} origem={item.origem}/></td><td>{dataBrasileira(item.data_movimento)}</td><td>{nomes[item.cliente_id]||'—'}</td><td><Etiqueta valor={item.tipo_movimento}/></td><td>{item.numero_documento||'—'}</td><td>{item.descricao||'—'}</td><td>{moeda(item.valor)}</td></tr>)}</tbody></table></div>}</Cartao>
    <ModalMovimento novo={filtros.novo} editar={filtros.editar} fecharEm={base} modo="convencional"/>
  </>;
}
