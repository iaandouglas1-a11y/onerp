import {GraficoBarras} from '@/componentes/globais/graficos-operacionais';
import Link from 'next/link';
import { CabecalhoPagina, Indicador, Cartao } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { ListaClientes } from '@/modulos/societario/componentes/lista-clientes';
import { FormularioCliente } from '@/modulos/societario/componentes/formulario-cliente';
import { listarClientes } from '@/modulos/societario/consultas';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { cofreGovBrConfigurado, obterResumoAcessoGovBr } from '@/modulos/societario/acesso-govbr';
export default async function PaginaClientes({searchParams}:{searchParams:Promise<{novo?:string;editar?:string}>}) {
  const filtros=await searchParams;
  const [clientes]=await Promise.all([listarClientes(),exigirEscritorio()]);
  const ativos=clientes.filter(item=>item.situacao==='ATIVO').length;
  const implantacao=clientes.filter(item=>item.situacao==='ONBOARDING').length;
  const risco=clientes.filter(item=>item.situacao==='RISCO').length;
  const cadastroHabilitado=true;
  const clienteEmEdicao=clientes.find(item=>item.id===filtros.editar);
  const cofreHabilitado=cofreGovBrConfigurado();
  const acessoGov=clienteEmEdicao&&cofreHabilitado?await obterResumoAcessoGovBr(clienteEmEdicao.id):null;
  return <><CabecalhoPagina titulo="Clientes" descricao="Gestão centralizada dos cadastros e relacionamentos." acao={cadastroHabilitado?'Novo cliente':undefined} rotaAcao={cadastroHabilitado?'/societario/clientes?novo=1':undefined}/><div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Clientes cadastrados" valor={clientes.length}/><Indicador legenda="Clientes ativos" valor={ativos}/><Indicador legenda="Em implantação" valor={implantacao}/><Indicador legenda="Em risco" valor={risco}/></div>
    <Cartao titulo="Cadastro de clientes" acoes={<div className="linha"><Link className="botao" href="/societario/tarefas">Tarefas</Link><Link className="botao" href="/societario/obrigacoes">Obrigações</Link><Link className="botao" href="/societario/servicos">Serviços</Link></div>}><ListaClientes clientes={clientes}/></Cartao>
    <div className="grade colunas-2" style={{marginTop:16}}><GraficoBarras titulo="Situação da carteira" subtitulo="Distribuição dos clientes por situação cadastral" itens={[{rotulo:"Ativos",valor:ativos},{rotulo:"Em implantação",valor:implantacao,cor:"#d2a14e"},{rotulo:"Em risco",valor:risco,cor:"#d76a63"},{rotulo:"Demais situações",valor:Math.max(0,clientes.length-ativos-implantacao-risco),cor:"#a7b2bd"}]}/><Cartao titulo="Rotinas societárias"><div className="item-lista"><Link href="/societario/tarefas">Acompanhar tarefas</Link></div><div className="item-lista"><Link href="/societario/obrigacoes">Consultar obrigações</Link></div><div className="item-lista"><Link href="/societario/documentos">Organizar documentos</Link></div></Cartao></div>
    {cadastroHabilitado&&filtros.novo==='1'&&<JanelaModal titulo="Novo cliente" descricao="Informações cadastrais e fiscais" fecharEm="/societario/clientes" largura="ampla"><FormularioCliente cofreHabilitado={cofreHabilitado}/></JanelaModal>}
    {cadastroHabilitado&&clienteEmEdicao&&<JanelaModal titulo="Editar cliente" descricao={clienteEmEdicao.razao_social} fecharEm="/societario/clientes" largura="ampla"><FormularioCliente cliente={clienteEmEdicao} acessoGov={acessoGov} cofreHabilitado={cofreHabilitado}/></JanelaModal>}
  </>;
}
