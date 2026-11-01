import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CabecalhoPagina, Cartao, Etiqueta } from '@/componentes/globais/elementos';
import { buscarCliente } from '@/modulos/societario/consultas';
import { AbasCliente,SecaoCliente } from '@/modulos/societario/componentes/secoes-cliente';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioCliente } from '@/modulos/societario/componentes/formulario-cliente';
import { dataBrasileira } from '@/lib/utilitarios/formatacao';
export default async function PaginaDetalheCliente({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{aba?:string;editar?:string}>}) {
  const {id}=await params;const {aba='resumo',editar}=await searchParams;const cliente=await buscarCliente(id);if(!cliente)notFound();
  return <><CabecalhoPagina titulo={cliente.nome_fantasia||cliente.razao_social} descricao={`${cliente.razao_social} · ${cliente.cpf_cnpj}`} acao="Editar cadastro" rotaAcao={`/societario/clientes/${id}?aba=${aba}&editar=cadastro`}/>
    <AbasCliente id={id} aba={aba}/>
    {editar==='cadastro'&&<JanelaModal titulo="Editar cliente" descricao={cliente.razao_social} fecharEm={`/societario/clientes/${id}?aba=${aba}`} largura="ampla"><FormularioCliente cliente={cliente}/></JanelaModal>}
    {aba==='resumo'?<div className="grade colunas-2"><Cartao titulo="Dados cadastrais"><div className="metrica-lista"><span className="muted">Tipo</span><span>{cliente.tipo_pessoa}</span></div><div className="metrica-lista"><span className="muted">Situação</span><Etiqueta valor={cliente.situacao}/></div><div className="metrica-lista"><span className="muted">Regime</span><span>{cliente.regime_tributario?.replaceAll('_',' ')||'Não informado'}</span></div><div className="metrica-lista"><span className="muted">Abertura</span><span>{dataBrasileira(cliente.data_abertura)}</span></div><div className="metrica-lista"><span className="muted">CNAE principal</span><span>{cliente.cnae_principal||'—'}</span></div></Cartao>
    <Cartao titulo="Atalhos operacionais"><div className="grade" style={{gap:9}}>{[['Contatos','contatos'],['Serviços contratados','servicos'],['Obrigações','obrigacoes'],['Tarefas','tarefas'],['Implantação','implantacao'],['Documentos','documentos'],['Credenciais','acessos']].map(([nome,chave])=><Link className="botao" href={`/societario/clientes/${id}?aba=${chave}`} key={chave}>{nome}</Link>)}</div></Cartao></div>:<SecaoCliente id={id} aba={aba} editar={editar}/>}
  </>;
}
