import Link from 'next/link';
import { CabecalhoPagina, Cartao, Etiqueta, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { listarEventosFolha } from '@/modulos/folha/consultas';
import { FormularioEvento } from '@/modulos/folha/componentes/formulario-evento';
export default async function PaginaEventos({searchParams}:{searchParams:Promise<{novo?:string;editar?:string}>}){
 const filtros=await searchParams;const eventos=await listarEventosFolha();const editar=eventos.find(e=>e.id===filtros.editar);
 return <><CabecalhoPagina titulo="Eventos da folha" descricao="Proventos, descontos e informativos com incidências parametrizadas." acao="Novo evento" rotaAcao="/folha/eventos?novo=1"/>
 <div className="aviso-configuracao">Códigos 1 (salário), 26 (INSS), 27 (IRRF) e 28 (FGTS informativo) são automáticos e reservados. Os demais eventos ativos são lançados com valores informados. Confira incidências e legislação antes de gerar contracheques.</div>
 <Cartao titulo="Catálogo de eventos" acoes={<Link href="/folha/lancamentos" className="botao">Lançamentos por competência</Link>}>
 {eventos.length===0?<ListaVazia texto="Nenhum evento adicional cadastrado. Salário, INSS e IRRF funcionam sem registro manual."/>:
 <div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Código</th><th>Descrição</th><th>Tipo</th><th>INSS</th><th>IRRF</th><th>FGTS</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{eventos.map(e=><tr key={e.id}><td>{e.codigo}</td><td>{e.nome}</td><td>{e.tipo_evento}</td>{(['incide_inss','incide_irrf','incide_fgts'] as const).map(chave=><td key={chave}>{e.configuracao_calculo?.[chave]===true?'Sim':'Não'}</td>)}<td>{e.configuracao_calculo?.calculo==='AUTOMATICO'?<span className="etiqueta azul">Automático</span>:<Etiqueta valor={e.ativo?'ATIVO':'INATIVO'}/>}</td><td>{e.configuracao_calculo?.calculo==='AUTOMATICO'?<span className="muted pequeno">Gerado pelo sistema</span>:<Link href={`/folha/eventos?editar=${e.id}`} className="botao">Editar</Link>}</td></tr>)}</tbody></table></div>}
 </Cartao>
 {filtros.novo==='1'&&<JanelaModal titulo="Novo evento" largura="ampla" fecharEm="/folha/eventos"><FormularioEvento/></JanelaModal>}
 {editar&&<JanelaModal titulo="Editar evento" largura="ampla" fecharEm="/folha/eventos"><FormularioEvento evento={editar}/></JanelaModal>}
 </>;
}
