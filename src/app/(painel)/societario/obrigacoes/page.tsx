import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { atualizarSituacaoObrigacao,criarModeloObrigacao,salvarRegistroSocietario } from '@/modulos/societario/acoes';
import { dataBrasileira } from '@/lib/utilitarios/formatacao';
export default async function Obrigacoes({searchParams}:{searchParams:Promise<{nova?:string;modelo?:string}>}){
  const filtros=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();
  const [{data:obrigacoes},{data:clientes},{data:modelos}]=await Promise.all([
    banco.from('obrigacoes_clientes').select('*').eq('escritorio_id',escritorioId).order('data_vencimento'),
    banco.from('clientes').select('id,razao_social').eq('escritorio_id',escritorioId).order('razao_social'),
    banco.from('modelos_obrigacoes').select('*').eq('escritorio_id',escritorioId).order('nome'),
  ]);
  const nomes=Object.fromEntries((clientes??[]).map(cliente=>[cliente.id,cliente.razao_social]));
  const podeEditar=true;
  return <><CabecalhoPagina titulo="Obrigações recorrentes" descricao="Prazos por cliente e modelos para uso operacional." acao={podeEditar?'Nova obrigação':undefined} rotaAcao="/societario/obrigacoes?nova=1"/>
    <Cartao titulo="Obrigações registradas">{!obrigacoes?.length?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Obrigação</th><th>Cliente</th><th>Vencimento</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{obrigacoes.map(item=><tr key={item.id}><td><Link href={`/societario/clientes/${item.cliente_id}?aba=obrigacoes`}>{item.titulo}</Link></td><td>{nomes[item.cliente_id]??'—'}</td><td>{dataBrasileira(item.data_vencimento)}</td><td><Etiqueta valor={item.situacao}/></td><td><form action={atualizarSituacaoObrigacao} className="linha"><input type="hidden" name="id" value={item.id}/><select name="situacao" defaultValue={item.situacao} className="entrada" style={{minWidth:150}} disabled={!podeEditar}>{['PENDENTE','EM_ANDAMENTO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].map(valor=><option key={valor} value={valor}>{valor.replaceAll('_',' ')}</option>)}</select>{podeEditar&&<button className="botao">Salvar</button>}</form></td></tr>)}</tbody></table></div>}</Cartao>
    <div style={{marginTop:16}}><Cartao titulo="Modelos de obrigação" subtitulo="Modelos não geram novas competências automaticamente nesta versão." acoes={podeEditar?<Link href="/societario/obrigacoes?modelo=1" className="botao primario">Novo modelo</Link>:null}>{!modelos?.length?<ListaVazia/>:modelos.map(item=><div className="item-lista" key={item.id}><div className="nome-item">{item.nome}</div><span className="muted pequeno">{item.modulo} · {item.recorrencia}</span></div>)}</Cartao></div>
    {podeEditar&&filtros.nova==='1'&&<JanelaModal titulo="Nova obrigação" fecharEm="/societario/obrigacoes"><form action={salvarRegistroSocietario} className="grade-formulario"><input type="hidden" name="tipo" value="obrigacao"/><div className="largo"><Campo nome="cliente_id" rotulo="Cliente" obrigatorio opcoes={(clientes??[]).map(item=>({valor:item.id,rotulo:item.razao_social}))}/></div><div className="largo"><Campo nome="titulo" rotulo="Obrigação" obrigatorio/></div><Campo nome="data_vencimento" rotulo="Vencimento" tipo="date" obrigatorio/><Campo nome="inicio_periodo" rotulo="Início da competência" tipo="date"/><Campo nome="fim_periodo" rotulo="Fim da competência" tipo="date"/><Campo nome="situacao" rotulo="Situação" padrao="PENDENTE" opcoes={['PENDENTE','EM_ANDAMENTO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].map(valor=>({valor,rotulo:valor.replaceAll('_',' ')}))}/><button className="botao primario largo">Salvar obrigação</button></form></JanelaModal>}
    {podeEditar&&filtros.modelo==='1'&&<JanelaModal titulo="Novo modelo de obrigação" fecharEm="/societario/obrigacoes"><form action={criarModeloObrigacao} className="grade"><Campo nome="nome" rotulo="Nome" obrigatorio/><Campo nome="modulo" rotulo="Módulo" padrao="SOCIETARIO"/><Campo nome="recorrencia" rotulo="Recorrência" obrigatorio padrao="MONTHLY" opcoes={[{valor:'MONTHLY',rotulo:'Mensal'},{valor:'QUARTERLY',rotulo:'Trimestral'},{valor:'YEARLY',rotulo:'Anual'},{valor:'ONCE',rotulo:'Única'}]}/><Campo nome="dia_vencimento" rotulo="Dia do vencimento" tipo="number" min="1" max="31"/><Campo nome="descricao" rotulo="Descrição"/><button className="botao primario">Salvar modelo</button></form></JanelaModal>}
  </>;
}
