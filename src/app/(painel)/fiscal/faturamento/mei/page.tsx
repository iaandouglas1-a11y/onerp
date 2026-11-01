import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, Indicador, ListaVazia } from '@/componentes/globais/elementos';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { resumoFaturamento } from '@/modulos/fiscal/consultas';
import { limiteEfetivoMei,situacaoLimite,totalizarReceitas } from '@/modulos/fiscal/calculos';
import { registrarAjusteMei } from '@/modulos/fiscal/acoes';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { ModalMovimento } from '@/modulos/fiscal/componentes/modal-movimento';
import { AcoesMovimento } from '@/modulos/fiscal/componentes/acoes-movimento';
import { dataBrasileira, moeda, mesAtual } from '@/lib/utilitarios/formatacao';
export default async function FaturamentoMei({searchParams}:{searchParams:Promise<{cliente?:string;competencia?:string;novo?:string;editar?:string;ajustar?:string}>}){
  const filtros=await searchParams;const {banco,escritorioId}=await exigirEscritorio();
  const {clientes}=await resumoFaturamento(filtros.competencia);
  const meis=clientes.filter(item=>item.regime_tributario==='MEI');const cliente=meis.find(item=>item.id===filtros.cliente)??meis[0];
  const mes=/^\d{4}-(0[1-9]|1[0-2])$/.test(filtros.competencia??'')?filtros.competencia!:mesAtual();const ano=Number(mes.slice(0,4));
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
  const meses=Array.from({length:12},(_,indice)=>{const numero=String(indice+1).padStart(2,'0');const periodo=`${ano}-${numero}-01`;return {periodo,mes:new Date(`${ano}-${numero}-01T12:00:00Z`).toLocaleDateString('pt-BR',{month:'short',timeZone:'UTC'}),...totalizarReceitas(itens.filter(item=>item.competencia===periodo),ajustesValidos.filter(item=>item.competencia===periodo))};});
  const operacaoHabilitada=true; // Vínculo ativo ao escritório já foi validado.
  const podeEditar=true; // A autenticação e o vínculo ativo são exigidos no servidor.
  const base=`/fiscal/faturamento/mei?cliente=${cliente.id}&competencia=${mes}`;
  const receitasAno=itens.filter(item=>item.tipo_movimento==='RECEITA').sort((a,b)=>b.data_movimento.localeCompare(a.data_movimento));
  return <><CabecalhoPagina titulo="Faturamento MEI" descricao="Acompanhamento de receitas e limites legalmente parametrizados." acao={podeEditar?"Lançar receita":undefined} rotaAcao={`${base}&novo=1`}/>
    <form className="filtros" action="/fiscal/faturamento/mei"><div className="campo" style={{minWidth:300}}><label>Cliente MEI</label><select name="cliente" defaultValue={cliente.id}>{meis.map(item=><option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></div><div className="campo"><label>Competência</label><input type="month" name="competencia" defaultValue={mes}/></div><button className="botao" type="submit">Consultar</button><Link href="/configuracoes" className="botao">Parâmetros</Link><Link href={`/fiscal/faturamento/exportar?tipo=mei&competencia=${mes}&cliente=${cliente.id}`} className="botao">Exportar PDF</Link><a className="botao" href="#receitas-cadastradas">Gerenciar receitas ({receitasAno.length})</a></form>
    {!regra&&<div className="aviso-configuracao">Nenhum limite MEI aprovado para {ano}. Configure o valor anual e o fundamento legal em Configurações. Sem isso, o sistema não classificará o cliente como dentro ou fora do limite.</div>}
    <div className="grade colunas-4" style={{marginBottom:15}}><Indicador legenda="Receita do mês (com ajustes)" valor={moeda(mesReceitas.total)}/><Indicador legenda="Acumulado no ano" valor={moeda(receitas.total)}/><Indicador legenda="Limite efetivo do ano" valor={limite===null?'Não configurado':moeda(limite)}/><Indicador legenda="Percentual utilizado" valor={status?`${(status.percentual*100).toFixed(1).replace('.',',')}%`:'—'} detalhe={status?.situacao??'Aguardando parametrização'}/></div>
    <section id="receitas-cadastradas" style={{marginBottom:15}} aria-label="Gerenciamento de receitas MEI">
      <Cartao titulo={`Receitas cadastradas no ano — ${ano}`} acoes={<Link className="botao primario" href={`${base}&novo=1`}>+ Lançar receita</Link>}>
        <p className="muted pequeno" style={{marginBottom:12}}>A competência selecionada define os indicadores do mês, mas esta lista apresenta <strong>todas as receitas de {ano}</strong>, inclusive de meses anteriores. Use Editar ou Excluir na linha desejada.</p>
        {receitasAno.length===0?<ListaVazia texto="Nenhuma receita registrada neste ano. Clique em Lançar receita para adicionar."/>:<div className="tabela-wrapper"><table className="tabela tabela-gerenciamento"><thead><tr><th>Ações</th><th>Competência</th><th>Data</th><th>Atividade</th><th>Documento</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>{receitasAno.map(item=><tr key={item.id}>
          <td><AcoesMovimento id={item.id} clienteId={cliente.id} base={base} origem={item.origem}/></td>
          <td>{item.competencia.slice(5,7)}/{item.competencia.slice(0,4)}</td>
          <td>{dataBrasileira(item.data_movimento)}</td><td>{item.atividade_receita||'—'}</td><td>{item.numero_documento||'—'}</td><td>{item.descricao||'—'}</td><td>{moeda(item.valor)}</td>
        </tr>)}</tbody></table></div>}
      </Cartao>
    </section>
    {status&&<Cartao titulo="Acompanhamento do limite"><div className="linha entre" style={{marginBottom:10}}><span>{moeda(receitas.total)} de {moeda(limite)}</span><span className="muted pequeno">{(status.percentual*100).toFixed(1).replace('.',',')}%</span></div><div className="progresso"><span style={{width:`${Math.max(0,Math.min(100,status.percentual*100))}%`,background:status.situacao==='ULTRAPASSADO'?'#b83a39':status.situacao==='ATENCAO'?'#c18a25':'#7CB93C'}}/></div><p className="muted pequeno" style={{marginTop:10}}>Regra aprovada para {ano}. {cliente.data_abertura&&regra?.proporcional_ano_abertura?'O limite pode ser proporcional ao ano de abertura.':''}</p></Cartao>}
    <div className="layout-detalhe" style={{marginTop:15}}><Cartao titulo={`Receitas mensais — ${ano}`}><div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Mês</th><th>Comércio/Indústria</th><th>Serviços</th><th>Total com ajustes</th></tr></thead><tbody>{meses.map(item=><tr key={item.periodo}><td>{item.mes}</td><td>{moeda(item.comercio)}</td><td>{moeda(item.servicos)}</td><td>{moeda(item.total)}</td></tr>)}<tr style={{background:'#eef8e7'}}><td><b>Total anual</b></td><td>{moeda(receitas.comercio)}</td><td>{moeda(receitas.servicos)}</td><td><b>{moeda(receitas.total)}</b></td></tr></tbody></table></div><p className="muted pequeno">Entradas e despesas não são somadas ao faturamento. Ajustes administrativos integram a coluna total.</p></Cartao>
    <div className="grade"><Cartao titulo="Resumo do ano"><div className="metrica-lista"><span>Comércio e indústria</span><b>{moeda(receitas.comercio)}</b></div><div className="metrica-lista"><span>Serviços</span><b>{moeda(receitas.servicos)}</b></div><div className="metrica-lista"><span>Ajustes manuais</span><b>{moeda(ajustesValidos.reduce((soma,item)=>soma+item.valor,0))}</b></div><div className="metrica-lista"><span>Total</span><b>{moeda(receitas.total)}</b></div></Cartao>
      {operacaoHabilitada&&<Cartao titulo="Ajustes administrativos" acoes={<Link className="botao primario" href={`${base}&ajustar=1`}>Novo ajuste</Link>}><p className="muted pequeno">Correções justificadas alteram o total acumulado e ficam vinculadas à competência.</p><div className="metrica-lista"><span>Ajustes no ano</span><b>{moeda(ajustesValidos.reduce((soma,item)=>soma+item.valor,0))}</b></div></Cartao>}
    </div></div>
    <ModalMovimento novo={filtros.novo} editar={filtros.editar} clienteSelecionado={cliente.id} fecharEm={base} modo="mei"/>
    {operacaoHabilitada&&filtros.ajustar==='1'&&<JanelaModal titulo="Novo ajuste MEI" descricao="Ajustes com justificativa e rastreabilidade" fecharEm={base}><FormularioContinuo acao={registrarAjusteMei} className="grade" manterCampos={['competencia']}><input type="hidden" name="cliente_id" value={cliente.id}/><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={mes} obrigatorio/><Campo nome="valor" rotulo="Ajuste em R$ (com sinal)" obrigatorio placeholder="-100,00"/><Campo nome="justificativa" rotulo="Justificativa" obrigatorio/><button className="botao primario">Registrar ajuste</button></FormularioContinuo></JanelaModal>}
  </>;
}
