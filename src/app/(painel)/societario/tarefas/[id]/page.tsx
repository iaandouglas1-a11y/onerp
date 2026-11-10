import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CabecalhoPagina, Cartao, Campo, Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { dataBrasileira } from '@/lib/utilitarios/formatacao';
import { adicionarItemTarefa,alternarItemTarefa,comentarTarefa,atualizarSituacaoTarefa } from '@/modulos/societario/acoes';
export default async function DetalheTarefa({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{item?:string;comentario?:string;status?:string}>}){
  const {id}=await params;const filtros=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();const podeEditar=true;
  const {data:tarefa}=await banco.from('tarefas').select('*').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();if(!tarefa)notFound();
  const [{data:itens},{data:comentarios}]=await Promise.all([
    banco.from('itens_checklist_tarefas').select('*').eq('escritorio_id',escritorioId).eq('tarefa_id',id).order('posicao'),
    banco.from('comentarios_tarefas').select('*').eq('escritorio_id',escritorioId).eq('tarefa_id',id).order('criado_em',{ascending:false}),
  ]);
  const base=`/societario/tarefas/${id}`;
  return <><CabecalhoPagina titulo={tarefa.titulo} descricao={`Vencimento: ${dataBrasileira(tarefa.data_vencimento)}`}/>
    <Cartao titulo="Detalhes" acoes={podeEditar?<Link className="botao" href={`${base}?status=1`}>Alterar situação</Link>:null}><div className="linha"><Etiqueta valor={tarefa.situacao}/><Etiqueta valor={tarefa.prioridade}/></div><p style={{marginTop:14}}>{tarefa.descricao||'Sem descrição.'}</p><Link className="botao" href={`/societario/clientes/${tarefa.cliente_id}?aba=tarefas`}>Abrir no cliente</Link></Cartao>
    <div className="grade colunas-2" style={{marginTop:16}}><Cartao titulo="Checklist" acoes={podeEditar?<Link className="botao primario" href={`${base}?item=1`}>Novo item</Link>:null}>
      {!itens?.length&&<ListaVazia/>}{itens?.map(item=><div key={item.id} className="item-lista"><div><span style={{textDecoration:item.concluido?'line-through':'none'}}>{item.descricao}</span></div>{podeEditar&&<form action={alternarItemTarefa}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="tarefa_id" value={id}/><input type="hidden" name="concluido" value={String(!item.concluido)}/><button className="botao">{item.concluido?'Reabrir':'Concluir'}</button></form>}</div>)}
    </Cartao>
    <Cartao titulo="Comentários" acoes={podeEditar?<Link className="botao primario" href={`${base}?comentario=1`}>Novo comentário</Link>:null}>
      {!comentarios?.length&&<ListaVazia/>}{comentarios?.map(item=><div className="item-lista" key={item.id}><div>{item.comentario}<p className="muted pequeno" style={{marginTop:5}}>{dataBrasileira(item.criado_em)}</p></div></div>)}
    </Cartao></div>
    {podeEditar&&filtros.status==='1'&&<JanelaModal titulo="Atualizar situação da tarefa" fecharEm={base}><FormularioContinuo className="grade" acao={atualizarSituacaoTarefa} modo="acao"><input type="hidden" name="id" value={id}/><Campo rotulo="Situação" nome="situacao" padrao={tarefa.situacao} opcoes={['A_FAZER','EM_EXECUCAO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].map(valor=>({valor,rotulo:valor.replaceAll('_',' ')}))}/><button className="botao primario">Atualizar</button></FormularioContinuo></JanelaModal>}
    {podeEditar&&filtros.item==='1'&&<JanelaModal titulo="Adicionar item ao checklist" fecharEm={base}><FormularioContinuo className="grade" acao={adicionarItemTarefa}><input type="hidden" name="tarefa_id" value={id}/><Campo nome="descricao" rotulo="Descrição" obrigatorio/><button className="botao primario">Adicionar item</button></FormularioContinuo></JanelaModal>}
    {podeEditar&&filtros.comentario==='1'&&<JanelaModal titulo="Novo comentário" fecharEm={base}><FormularioContinuo className="grade" acao={comentarTarefa}><input type="hidden" name="tarefa_id" value={id}/><div className="campo"><label htmlFor="comentario">Comentário</label><textarea id="comentario" name="comentario" required/></div><button className="botao primario">Publicar comentário</button></FormularioContinuo></JanelaModal>}
  </>;
}
