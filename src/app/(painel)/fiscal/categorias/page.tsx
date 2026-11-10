import { CabecalhoPagina,Cartao,Campo,ListaVazia,Etiqueta } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { criarCategoriaFiscal } from '@/modulos/fiscal/acoes';
export default async function CategoriasFiscais({searchParams}:{searchParams:Promise<{nova?:string}>}){
  const {nova}=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();
  const {data:categorias}=await banco.from('categorias_fiscais').select('*').eq('escritorio_id',escritorioId).order('nome');
  const podeEditar=true;
  return <><CabecalhoPagina titulo="Categorias fiscais" descricao="Classificação das receitas, entradas e despesas." acao={podeEditar?'Nova categoria':undefined} rotaAcao="/fiscal/categorias?nova=1"/>
    <Cartao titulo="Categorias cadastradas">{!categorias?.length?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Nome</th><th>Tipo de movimento</th><th>Situação</th></tr></thead><tbody>{categorias.map(item=><tr key={item.id}><td>{item.nome}</td><td><Etiqueta valor={item.tipo_movimento}/></td><td>{item.ativo?'Ativa':'Inativa'}</td></tr>)}</tbody></table></div>}</Cartao>
    {podeEditar&&nova==='1'&&<JanelaModal titulo="Nova categoria fiscal" fecharEm="/fiscal/categorias"><FormularioContinuo acao={criarCategoriaFiscal} className="grade"><Campo nome="nome" rotulo="Nome" obrigatorio/><Campo nome="tipo_movimento" rotulo="Tipo de movimento" obrigatorio padrao="RECEITA" opcoes={['RECEITA','ENTRADA','DESPESA'].map(valor=>({valor,rotulo:valor}))}/><button className="botao primario">Salvar categoria</button></FormularioContinuo></JanelaModal>}
  </>;
}
