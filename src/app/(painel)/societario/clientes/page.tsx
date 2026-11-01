import Link from 'next/link';
import { CabecalhoPagina, Indicador, Cartao } from '@/componentes/globais/elementos';
import { ListaClientes } from '@/modulos/societario/componentes/lista-clientes';
import { listarClientes } from '@/modulos/societario/consultas';
export default async function PaginaClientes() {
  const clientes=await listarClientes();const ativos=clientes.filter(item=>item.situacao==='ATIVO').length;
  const implantacao=clientes.filter(item=>item.situacao==='ONBOARDING').length;
  const risco=clientes.filter(item=>item.situacao==='RISCO').length;
  return <><CabecalhoPagina titulo="Clientes" descricao="Gestão centralizada dos cadastros e relacionamentos." acao="Novo cliente" rotaAcao="/societario/clientes/novo"/><div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Clientes cadastrados" valor={clientes.length}/><Indicador legenda="Clientes ativos" valor={ativos}/><Indicador legenda="Em implantação" valor={implantacao}/><Indicador legenda="Em risco" valor={risco}/></div>
    <Cartao titulo="Cadastro de clientes" acoes={<div className="linha"><Link className="botao" href="/societario/tarefas">Tarefas</Link><Link className="botao" href="/societario/obrigacoes">Obrigações</Link><Link className="botao" href="/societario/servicos">Serviços</Link></div>}><ListaClientes clientes={clientes}/></Cartao></>;
}
