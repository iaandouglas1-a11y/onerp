import Link from 'next/link';
import { CabecalhoPagina, Cartao, Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { dataBrasileira } from '@/lib/utilitarios/formatacao';
import { atualizarSituacaoTarefa } from '@/modulos/societario/acoes';
const colunas=[['A_FAZER','A fazer'],['EM_EXECUCAO','Em execução'],['AGUARDANDO_CLIENTE','Aguardando cliente'],['CONCLUIDA','Concluídas']];
export default async function Tarefas(){
  const {banco,escritorioId}=await exigirEscritorio();
  const [{data:registros,error:falha},{data:clientes}]=await Promise.all([banco.from('tarefas').select('id,titulo,cliente_id,data_vencimento,prioridade,situacao,descricao').eq('escritorio_id',escritorioId).order('data_vencimento',{ascending:true}),banco.from('clientes').select('id,razao_social').eq('escritorio_id',escritorioId)]);
  if(falha)throw new Error(falha.message);
  const nomes=Object.fromEntries((clientes??[]).map(item=>[item.id,item.razao_social]));
  return <><CabecalhoPagina titulo="Obrigações e tarefas" descricao="Organização operacional por situação, cliente e prazo."/><div className="linha" style={{marginBottom:15}}><Link className="botao" href="/societario/obrigacoes">Ver obrigações</Link><Link className="botao primario" href="/societario/clientes">Criar tarefa em um cliente</Link></div>
  <div className="quadro-tarefas">{colunas.map(([situacao,titulo])=>{const lista=(registros??[]).filter(item=>item.situacao===situacao);return <div className="coluna-tarefas" key={situacao}><h3>{titulo} <span className="etiqueta">{lista.length}</span></h3>{lista.map(item=><div className="cartao-tarefa" key={item.id}><p><Link href={`/societario/tarefas/${item.id}`}>{item.titulo}</Link></p><small>{nomes[item.cliente_id??'']??'Sem cliente'}</small><small>Vencimento: {dataBrasileira(item.data_vencimento)}</small><div className="linha" style={{marginTop:8}}><Etiqueta valor={item.prioridade}/><form action={atualizarSituacaoTarefa}><input type="hidden" name="id" value={item.id}/><select name="situacao" className="entrada" defaultValue={item.situacao} style={{fontSize:11,width:130,minHeight:30,padding:4}}>{colunas.map(([valor,rotulo])=><option key={valor} value={valor}>{rotulo}</option>)}<option value="CANCELADA">Cancelada</option></select><button type="submit" className="botao" style={{marginTop:5,minHeight:29}}>Salvar</button></form></div></div>)}{lista.length===0&&<p className="muted pequeno" style={{padding:10}}>Nenhuma tarefa.</p>}</div>})}</div></>;
}
