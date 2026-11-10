import { EntradaCompetencia } from '@/componentes/globais/competencia';
import Link from 'next/link';
import { CabecalhoPagina, Cartao, Indicador, ListaVazia } from '@/componentes/globais/elementos';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { resumoFaturamento } from '@/modulos/fiscal/consultas';
import { limiteEfetivoMei,situacaoLimite,totalizarReceitas } from '@/modulos/fiscal/calculos';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import { ModalMovimento } from '@/modulos/fiscal/componentes/modal-movimento';
import { AcoesMovimento } from '@/modulos/fiscal/componentes/acoes-movimento';
import { dataBrasileira, moeda, mesValido } from '@/lib/utilitarios/formatacao';
export default async function FaturamentoMei({searchParams}:{searchParams:Promise<{cliente?:string;competencia?:string;novo?:string;editar?:string}>}){
  const filtros=await searchParams;const {banco,escritorioId}=await exigirEscritorio();
  const {clientes}=await resumoFaturamento(filtros.competencia);
  const meis=clientes.filter(item=>item.regime_tributario==='MEI');const cliente=meis.find(item=>item.id===filtros.cliente)??meis[0];
  const mes=mesValido(filtros.competencia);const ano=Number(mes.slice(0,4));
  if(!cliente)return <><CabecalhoPagina titulo="Faturamento MEI" descricao="Acompanhamento do limite por empresa e ano-calendário."/><Cartao titulo="Nenhum cliente MEI"><ListaVazia texto="Cadastre um cliente com regime tributário MEI para começar."/></Cartao></>;
  const [movimentos,ajustes,{data:regra,error:erroRegra}]=await Promise.all([
    consultarTodasPaginas<{id:string;cliente_id:string;tipo_movimento:string;valor:number;competencia:string;atividade_receita:string|null;origem:string;data_movimento:string;numero_documento:string|null;descricao:string|null}>((inicio,fim)=>banco.from('movimentacoes_fiscais')
      .select('id,cliente_id,tipo_movimento,valor,competencia,atividade_receita,origem,data_movimento,numero_documento,descricao').eq('escritorio_id',escritorioId).eq('cliente_id',cliente.id)
      .gte('competencia',`${ano}-01-01`).lte('competencia',`${ano}-12-01`).order('id').range(inicio,fim)),
    consultarTodasPaginas<{id:string;valor:number;competencia:string;justificativa:string}>((inicio,fim)=>banco.from('ajustes_faturamento_mei')
      .select('id,valor,competencia,justificativa').eq('escritorio_id',escritorioId).eq('cliente_id',cliente.id)
      .gte('competencia',`${ano}-01-01`).lte('competencia',`${ano}-12-01`).order('id').range(inicio,fim)),
    banco.from('regras_limites_mei').select('ano_calendario,limite_anual,percentual_alerta,proporcional_ano_abertura,aprovado_em,fundamento_legal')
      .eq('escritorio_id',escritorioId).eq('ano_calendario',ano).not('aprovado_em','is',null).maybeSingle(),
  ]);
  if(erroRegra)throw new Error('Falha ao consultar limite MEI.');
  const itens=(movimentos??[]).map(item=>({...item,valor:Number(item.valor)}));const ajustesValidos=(ajustes??[]).map(item=>({...item,valor:Number(item.valor)}));
  const receitas=totalizarReceitas(itens,ajustesValidos);
  const mesReceitas=totalizarReceitas(itens.filter(item=>item.competencia===`${mes}-01`),ajustesValidos.filter(item=>item.competencia===`${mes}-01`));
  const limite=regra?limiteEfetivoMei({ano_calendario:ano,limite_anual:Number(regra.limite_anual),percentual_alerta:Number(regra.percentual_alerta),proporcional_ano_abertura:regra.proporcional_ano_abertura},cliente.data_abertura):null;
  const status=limite!==null?situacaoLimite(receitas.total,limite,Number(regra?.percentual_alerta??0.8)):null;
  const base=`/fiscal/faturamento/mei?cliente=${cliente.id}&competencia=${mes}`;
  const receitasAno=itens.filter(item=>item.tipo_movimento==='RECEITA').sort((a,b)=>b.data_movimento.localeCompare(a.data_movimento));
  return <><CabecalhoPagina titulo="Faturamento MEI" descricao="Receitas registradas e resumo do ano-calendário."/>
    <form className="filtros" action="/fiscal/faturamento/mei"><div className="campo" style={{minWidth:300}}><label>Cliente MEI</label><select name="cliente" defaultValue={cliente.id}>{meis.map(item=><option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></div><div className="campo"><label htmlFor="competencia-mei">Competência</label><EntradaCompetencia nome="competencia" id="competencia-mei" padrao={mes} obrigatorio/></div><button className="botao" type="submit">Consultar</button><Link href={`/fiscal/faturamento/exportar?tipo=mei&competencia=${mes}&cliente=${cliente.id}`} className="botao">Exportar PDF</Link></form>
    {!regra&&<div className="aviso-configuracao">Nenhum limite MEI aprovado para {ano}. Configure o valor anual e o fundamento legal em Configurações. Sem isso, o sistema não classificará o cliente como dentro ou fora do limite.</div>}
    <div className="grade colunas-4" style={{marginBottom:15}}><Indicador legenda="Receitas do mês" valor={moeda(mesReceitas.total)}/><Indicador legenda="Acumulado no ano" valor={moeda(receitas.total)}/><Indicador legenda="Limite efetivo do ano" valor={limite===null?'Não configurado':moeda(limite)}/><Indicador legenda="Percentual utilizado" valor={status?`${(status.percentual*100).toFixed(1).replace('.',',')}%`:'—'} detalhe={status?.situacao??'Aguardando parametrização'}/></div>
    <div style={{marginBottom:15}}><Cartao titulo="Resumo do ano"><div className="metrica-lista"><span>Comércio e indústria</span><b>{moeda(receitas.comercio)}</b></div><div className="metrica-lista"><span>Serviços</span><b>{moeda(receitas.servicos)}</b></div><div className="metrica-lista"><span>Total faturado</span><b>{moeda(receitas.total)}</b></div></Cartao></div>
    <section id="receitas-cadastradas" style={{marginBottom:15}} aria-label="Receitas MEI cadastradas">
      <Cartao titulo={`Receitas cadastradas no ano — ${ano}`} acoes={<Link className="botao primario" href={`${base}&novo=1`}>+ Lançar receita</Link>}>
        <p className="muted pequeno" style={{marginBottom:12}}>A competência selecionada define os indicadores do mês, mas esta lista apresenta <strong>todas as receitas de {ano}</strong>, inclusive de meses anteriores. Use Editar ou Excluir na linha desejada.</p>
        {receitasAno.length===0?<ListaVazia texto="Nenhuma receita registrada neste ano. Clique em Lançar receita para adicionar."/>:<div className="tabela-wrapper"><table className="tabela tabela-gerenciamento"><thead><tr><th>Ações</th><th>Competência</th><th>Data</th><th>Atividade</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>{receitasAno.map(item=><tr key={item.id}>
          <td><AcoesMovimento id={item.id} clienteId={cliente.id} base={base} origem={item.origem}/></td>
          <td>{item.competencia.slice(5,7)}/{item.competencia.slice(0,4)}</td>
          <td>{dataBrasileira(item.data_movimento)}</td><td>{item.atividade_receita||'—'}</td><td>{item.descricao||'—'}</td><td>{moeda(item.valor)}</td>
        </tr>)}</tbody></table></div>}
      </Cartao>
    </section>
    <ModalMovimento novo={filtros.novo} editar={filtros.editar} clienteSelecionado={cliente.id} fecharEm={base} modo="mei"/>
  </>;
}
