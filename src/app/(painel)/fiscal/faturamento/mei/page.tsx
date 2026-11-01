import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, Indicador, ListaVazia } from '@/componentes/globais/elementos';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { resumoFaturamento } from '@/modulos/fiscal/consultas';
import { limiteEfetivoMei,situacaoLimite,totalizarReceitas } from '@/modulos/fiscal/calculos';
import { registrarAjusteMei } from '@/modulos/fiscal/acoes';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import { moeda, mesAtual } from '@/lib/utilitarios/formatacao';
export default async function FaturamentoMei({searchParams}:{searchParams:Promise<{cliente?:string;competencia?:string}>}){
  const filtros=await searchParams;const {banco,escritorioId,perfilAcesso}=await exigirEscritorio();
  const {clientes}=await resumoFaturamento(filtros.competencia);
  const meis=clientes.filter(item=>item.regime_tributario==='MEI');const cliente=meis.find(item=>item.id===filtros.cliente)??meis[0];
  const mes=/^\d{4}-(0[1-9]|1[0-2])$/.test(filtros.competencia??'')?filtros.competencia!:mesAtual();const ano=Number(mes.slice(0,4));
  if(!cliente)return <><CabecalhoPagina titulo="Faturamento MEI" descricao="Acompanhamento do limite por empresa e ano-calendário."/><Cartao titulo="Nenhum cliente MEI"><ListaVazia texto="Cadastre um cliente com regime tributário MEI para começar."/></Cartao></>;
  const [movimentos,ajustes,{data:regra,error:erroRegra}]=await Promise.all([
    consultarTodasPaginas<{id:string;tipo_movimento:string;valor:number;competencia:string;atividade_receita:string|null}>((inicio,fim)=>banco.from('movimentacoes_fiscais')
      .select('id,tipo_movimento,valor,competencia,atividade_receita').eq('escritorio_id',escritorioId).eq('cliente_id',cliente.id)
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
  const ehAdministrador=perfilAcesso==='owner'||perfilAcesso==='admin';
  return <><CabecalhoPagina titulo="Faturamento MEI" descricao="Acompanhamento de receitas e limites legalmente parametrizados." acao="Lançar receita" rotaAcao={`/fiscal/lancamentos/novo?cliente=${cliente.id}`}/>
    <form className="filtros" action="/fiscal/faturamento/mei"><div className="campo" style={{minWidth:300}}><label>Cliente MEI</label><select name="cliente" defaultValue={cliente.id}>{meis.map(item=><option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></div><div className="campo"><label>Competência</label><input type="month" name="competencia" defaultValue={mes}/></div><button className="botao" type="submit">Consultar</button><Link href="/configuracoes" className="botao">Parâmetros</Link></form>
    {!regra&&<div className="aviso-configuracao">Nenhum limite MEI aprovado para {ano}. Configure o valor anual e o fundamento legal em Configurações. Sem isso, o sistema não classificará o cliente como dentro ou fora do limite.</div>}
    <div className="grade colunas-4" style={{marginBottom:15}}><Indicador legenda="Receita do mês (com ajustes)" valor={moeda(mesReceitas.total)}/><Indicador legenda="Acumulado no ano" valor={moeda(receitas.total)}/><Indicador legenda="Limite efetivo do ano" valor={limite===null?'Não configurado':moeda(limite)}/><Indicador legenda="Percentual utilizado" valor={status?`${(status.percentual*100).toFixed(1).replace('.',',')}%`:'—'} detalhe={status?.situacao??'Aguardando parametrização'}/></div>
    {status&&<Cartao titulo="Acompanhamento do limite"><div className="linha entre" style={{marginBottom:10}}><span>{moeda(receitas.total)} de {moeda(limite)}</span><span className="muted pequeno">{(status.percentual*100).toFixed(1).replace('.',',')}%</span></div><div className="progresso"><span style={{width:`${Math.max(0,Math.min(100,status.percentual*100))}%`,background:status.situacao==='ULTRAPASSADO'?'#b83a39':status.situacao==='ATENCAO'?'#c18a25':'#7CB93C'}}/></div><p className="muted pequeno" style={{marginTop:10}}>Regra aprovada para {ano}. {cliente.data_abertura&&regra?.proporcional_ano_abertura?'O limite pode ser proporcional ao ano de abertura.':''}</p></Cartao>}
    <div className="layout-detalhe" style={{marginTop:15}}><Cartao titulo={`Receitas mensais — ${ano}`}><div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Mês</th><th>Comércio/Indústria</th><th>Serviços</th><th>Total com ajustes</th></tr></thead><tbody>{meses.map(item=><tr key={item.periodo}><td>{item.mes}</td><td>{moeda(item.comercio)}</td><td>{moeda(item.servicos)}</td><td>{moeda(item.total)}</td></tr>)}<tr style={{background:'#eef8e7'}}><td><b>Total anual</b></td><td>{moeda(receitas.comercio)}</td><td>{moeda(receitas.servicos)}</td><td><b>{moeda(receitas.total)}</b></td></tr></tbody></table></div><p className="muted pequeno">Entradas e despesas não são somadas ao faturamento. Ajustes administrativos integram a coluna total.</p></Cartao>
    <div className="grade"><Cartao titulo="Resumo do ano"><div className="metrica-lista"><span>Comércio e indústria</span><b>{moeda(receitas.comercio)}</b></div><div className="metrica-lista"><span>Serviços</span><b>{moeda(receitas.servicos)}</b></div><div className="metrica-lista"><span>Ajustes manuais</span><b>{moeda(ajustesValidos.reduce((soma,item)=>soma+item.valor,0))}</b></div><div className="metrica-lista"><span>Total</span><b>{moeda(receitas.total)}</b></div></Cartao>
      {ehAdministrador&&<Cartao titulo="Ajuste justificado"><p className="muted pequeno">Utilize apenas quando precisar corrigir o acumulado sem duplicar receitas. Valores negativos são permitidos, com justificativa.</p><form action={registrarAjusteMei} className="grade"><input type="hidden" name="cliente_id" value={cliente.id}/><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={mes} obrigatorio/><Campo nome="valor" rotulo="Ajuste em R$ (com sinal)" obrigatorio placeholder="-100,00"/><Campo nome="justificativa" rotulo="Justificativa" obrigatorio/><button className="botao primario">Registrar ajuste</button></form></Cartao>}
    </div></div></>;
}
