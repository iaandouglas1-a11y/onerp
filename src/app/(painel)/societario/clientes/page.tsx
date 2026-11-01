import Link from 'next/link';
import { CabecalhoPagina, Indicador, Cartao } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { ListaClientes } from '@/modulos/societario/componentes/lista-clientes';
import { FormularioCliente } from '@/modulos/societario/componentes/formulario-cliente';
import { listarClientes } from '@/modulos/societario/consultas';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
export default async function PaginaClientes({searchParams}:{searchParams:Promise<{novo?:string;editar?:string}>}) {
  const filtros=await searchParams;
  const [clientes,contexto]=await Promise.all([listarClientes(),exigirEscritorio()]);
  const ativos=clientes.filter(item=>item.situacao==='ATIVO').length;
  const implantacao=clientes.filter(item=>item.situacao==='ONBOARDING').length;
  const risco=clientes.filter(item=>item.situacao==='RISCO').length;
  const permitirEdicao=contexto.perfilAcesso!=='viewer';
  const permitirExclusao=contexto.perfilAcesso==='owner'||contexto.perfilAcesso==='admin';
  const clienteEmEdicao=clientes.find(item=>item.id===filtros.editar);
  return <><CabecalhoPagina titulo="Clientes" descricao="Gestão centralizada dos cadastros e relacionamentos." acao={permitirEdicao?'Novo cliente':undefined} rotaAcao={permitirEdicao?'/societario/clientes?novo=1':undefined}/><div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Clientes cadastrados" valor={clientes.length}/><Indicador legenda="Clientes ativos" valor={ativos}/><Indicador legenda="Em implantação" valor={implantacao}/><Indicador legenda="Em risco" valor={risco}/></div>
    <Cartao titulo="Cadastro de clientes" acoes={<div className="linha"><Link className="botao" href="/societario/tarefas">Tarefas</Link><Link className="botao" href="/societario/obrigacoes">Obrigações</Link><Link className="botao" href="/societario/servicos">Serviços</Link></div>}><ListaClientes clientes={clientes} permitirEdicao={permitirEdicao} permitirExclusao={permitirExclusao}/></Cartao>
    {permitirEdicao&&filtros.novo==='1'&&<JanelaModal titulo="Novo cliente" descricao="Informações cadastrais e fiscais" fecharEm="/societario/clientes" largura="ampla"><FormularioCliente/></JanelaModal>}
    {permitirEdicao&&clienteEmEdicao&&<JanelaModal titulo="Editar cliente" descricao={clienteEmEdicao.razao_social} fecharEm="/societario/clientes" largura="ampla"><FormularioCliente cliente={clienteEmEdicao}/></JanelaModal>}
  </>;
}
