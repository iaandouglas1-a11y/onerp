import Link from 'next/link';
import { CabecalhoPagina, Cartao, ListaVazia, Campo } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioLancamento } from '@/modulos/folha/componentes/formulario-lancamento';
import { listarEmpregados,listarEventosFolha,listarLancamentosFolha } from '@/modulos/folha/consultas';
import { mesValido,formatarCompetencia,moeda } from '@/lib/utilitarios/formatacao';
import { excluirLancamentoEvento } from '@/modulos/folha/acoes';
import { listarClientes } from '@/modulos/societario/consultas';
import { BotaoConfirmar } from '@/componentes/globais/botao-confirmar';
export default async function PaginaLancamentos({searchParams}:{searchParams:Promise<{competencia?:string;cliente?:string;novo?:string;editar?:string}>}){
 const filtros=await searchParams;const competencia=mesValido(filtros.competencia);
 const [empregados,eventos,todosLancamentos,clientes]=await Promise.all([listarEmpregados(),listarEventosFolha(),listarLancamentosFolha(competencia),listarClientes()]);
 const clienteId=filtros.cliente&&clientes.some(c=>c.id===filtros.cliente)?filtros.cliente:'';
 const lancamentos=clienteId?todosLancamentos.filter(l=>l.cliente_id===clienteId):todosLancamentos;
 const empregadosFiltrados=clienteId?empregados.filter(e=>e.cliente_id===clienteId):empregados;
 const nomes=new Map(empregados.map(e=>[e.id,e.nome_completo]));const nomesEventos=new Map(eventos.map(e=>[e.id,`${e.codigo} · ${e.nome}`]));
 const editar=lancamentos.find(l=>l.id===filtros.editar);
 const rota=`/folha/lancamentos?competencia=${competencia}${clienteId?`&cliente=${clienteId}`:''}`;
 return <><CabecalhoPagina titulo="Lançamentos de eventos" descricao="Eventos variáveis por empregado e competência; valores informados em reais." acao="Lançar evento" rotaAcao={`${rota}&novo=1`}/>
 <form className="filtros" action="/folha/lancamentos"><Campo nome="cliente" rotulo="Empresa" padrao={clienteId} opcoes={[{valor:"",rotulo:"Todas as empresas"},...clientes.map(c=>({valor:c.id,rotulo:c.razao_social}))]}/><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={competencia} obrigatorio/><button className="botao" type="submit">Consultar</button></form>
 <Cartao titulo={`Eventos registrados · ${formatarCompetencia(competencia)}`} acoes={<Link href="/folha/contracheques" className="botao">Gerar contracheques</Link>}>
 {lancamentos.length===0?<ListaVazia texto="Nenhum evento variável para esta competência. O salário-base será calculado automaticamente."/>:
 <div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Empregado</th><th>Evento</th><th>Referência</th><th>Valor</th><th>Ações</th></tr></thead><tbody>{lancamentos.map(l=><tr key={l.id}><td>{nomes.get(l.empregado_id)||'—'}</td><td>{nomesEventos.get(l.evento_id)||'—'}</td><td>{l.referencia||'—'}</td><td>{moeda(l.valor)}</td><td><div className="acoes-registro"><Link className="botao" href={`${rota}&editar=${l.id}`}>Editar</Link><form action={excluirLancamentoEvento}><input type="hidden" name="id" value={l.id}/><BotaoConfirmar mensagem="Excluir este lançamento de folha?"/></form></div></td></tr>)}</tbody></table></div>}
 </Cartao>
 {filtros.novo==='1'&&<JanelaModal titulo="Lançar evento" fecharEm={rota} largura="ampla"><FormularioLancamento empregados={empregadosFiltrados} eventos={eventos} competencia={competencia}/></JanelaModal>}
 {editar&&<JanelaModal titulo="Editar lançamento" fecharEm={rota} largura="ampla"><FormularioLancamento empregados={empregadosFiltrados} eventos={eventos} competencia={competencia} lancamento={editar}/></JanelaModal>}
 </>;
}
