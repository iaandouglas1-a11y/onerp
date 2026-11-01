import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, ListaVazia } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { criarServico } from '@/modulos/societario/acoes';
export default async function Servicos({searchParams}:{searchParams:Promise<{novo?:string}>}){
  const {novo}=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();
  const {data:servicos,error:erro}=await banco.from('servicos').select('*').eq('escritorio_id',escritorioId).order('nome');if(erro)throw new Error(erro.message);
  const podeEditar=true;
  return <><CabecalhoPagina titulo="Catálogo de serviços" descricao="Serviços contratáveis pelos clientes do escritório." acao={podeEditar?'Novo serviço':undefined} rotaAcao="/societario/servicos?novo=1"/>
    <Cartao titulo="Serviços disponíveis">{!servicos?.length?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Código</th><th>Serviço</th><th>Descrição</th><th>Situação</th></tr></thead><tbody>{servicos.map(servico=><tr key={servico.id}><td>{servico.codigo}</td><td>{servico.nome}</td><td>{servico.descricao||'—'}</td><td><span className={`etiqueta ${servico.ativo?'verde':'vermelho'}`}>{servico.ativo?'Ativo':'Inativo'}</span></td></tr>)}</tbody></table></div>}</Cartao>
    {podeEditar&&novo==='1'&&<JanelaModal titulo="Cadastrar serviço" fecharEm="/societario/servicos"><FormularioContinuo acao={criarServico} className="grade"><Campo nome="codigo" rotulo="Código" obrigatorio placeholder="Ex.: MEI"/><Campo nome="nome" rotulo="Nome" obrigatorio/><Campo nome="descricao" rotulo="Descrição"/><div className="linha"><button className="botao primario">Salvar serviço</button><Link href="/societario/servicos" className="botao">Cancelar</Link></div></FormularioContinuo></JanelaModal>}
  </>;
}
