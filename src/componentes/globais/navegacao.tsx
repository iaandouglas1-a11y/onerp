'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType } from 'react';
import { LayoutDashboard, Building2, ReceiptText, BookOpen, UsersRound, Wallet, Settings2, ListTodo, LogOut, ChevronDown, ChevronRight, FolderOpen, LockKeyhole } from 'lucide-react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';

type IconeMenu=ComponentType<{size?:number;strokeWidth?:number}>;
type FuncaoMenu={titulo:string;rota?:string};
type ModuloMenu={chave:string;titulo:string;icone:IconeMenu;funcoes:FuncaoMenu[]};
const modulos:ModuloMenu[]=[
  {chave:'societario',titulo:'Societário',icone:Building2,funcoes:[
    {titulo:'Clientes',rota:'/societario/clientes'}, {titulo:'Serviços',rota:'/societario/servicos'},
    {titulo:'Tarefas',rota:'/societario/tarefas'}, {titulo:'Obrigações',rota:'/societario/obrigacoes'},
    {titulo:'Documentos',rota:'/societario/documentos'}, {titulo:'Acessos',rota:'/societario/acessos'},
    {titulo:'Relatórios societários'},
  ]},
  {chave:'fiscal',titulo:'Fiscal',icone:ReceiptText,funcoes:[
    {titulo:'Visão do faturamento',rota:'/fiscal/faturamento'},
    {titulo:'Faturamento MEI',rota:'/fiscal/faturamento/mei'},
    {titulo:'Faturamento convencional',rota:'/fiscal/faturamento/convencional'},
    {titulo:'Categorias fiscais',rota:'/fiscal/categorias'},
    {titulo:'Documentos fiscais'}, {titulo:'DAS MEI'}, {titulo:'DASN-SIMEI'},
  ]},
  {chave:'contabil',titulo:'Contábil',icone:BookOpen,funcoes:[{titulo:'Plano de contas'},{titulo:'Lançamentos'},{titulo:'Conciliação bancária'},{titulo:'Demonstrativos'}]},
  {chave:'folha',titulo:'Folha de pagamento',icone:UsersRound,funcoes:[{titulo:'Empregados'},{titulo:'Eventos'},{titulo:'Processamento'},{titulo:'Férias'}]},
  {chave:'financeiro',titulo:'Financeiro',icone:Wallet,funcoes:[{titulo:'Honorários'},{titulo:'Recebimentos'},{titulo:'Fluxo de caixa'},{titulo:'Relatórios'}]},
];
export function Navegacao(){
  const caminho=usePathname();
  const [abertos,definirAbertos]=useState<string[]>(()=>modulos.filter(item=>caminho.startsWith(`/${item.chave}`)).map(item=>item.chave));
  function alternar(chave:string){definirAbertos(atuais=>atuais.includes(chave)?atuais.filter(item=>item!==chave):[...atuais,chave]);}
  return <><aside className="lateral"><Link className="marca" href="/inicio" aria-label="On Contabilidade — início"><img src="/marca/on-contabilidade-clara.svg" alt="On Contabilidade"/></Link>
    <div className="titulo-menu">NAVEGAÇÃO</div><nav aria-label="Módulos do ERP">
      <Link href="/inicio" className={`link-menu ${caminho==='/inicio'?'ativo':''}`}><LayoutDashboard/>Dashboard</Link>
      {modulos.map(modulo=>{const Icone=modulo.icone;const aberto=abertos.includes(modulo.chave)||(!abertos.length&&caminho.startsWith(`/${modulo.chave}`));const ativo=caminho.startsWith(`/${modulo.chave}`);
        return <div className="grupo-menu" key={modulo.chave}>
          <button type="button" aria-expanded={aberto} className={`link-menu botao-modulo ${ativo?'ativo':''}`} onClick={()=>alternar(modulo.chave)}><Icone/><span>{modulo.titulo}</span>{aberto?<ChevronDown className="seta-menu"/>:<ChevronRight className="seta-menu"/>}</button>
          {aberto&&<div className="submenu" aria-label={`Funções de ${modulo.titulo}`}>{modulo.funcoes.map(funcao=>funcao.rota?<Link key={funcao.titulo} href={funcao.rota} className={`subitem-menu ${caminho===funcao.rota?'ativo':''}`}>{funcao.titulo}</Link>:<span key={funcao.titulo} className="subitem-menu desabilitado" title="Funcionalidade planejada">{funcao.titulo}<LockKeyhole size={11}/></span>)}</div>}
        </div>;
      })}
      <Link href="/configuracoes" className={`link-menu ${caminho.startsWith('/configuracoes')?'ativo':''}`}><Settings2/>Configurações</Link>
    </nav>
    <div className="rodape-menu"><button className="botao" type="button" onClick={async()=>{await criarClienteNavegador().auth.signOut();window.location.assign('/entrar');}}><LogOut size={14}/> Encerrar sessão</button><p style={{marginTop:15}}>On Contabilidade</p></div>
  </aside>
  <nav className="navegacao-mobile" aria-label="Navegação móvel">{[{rota:'/inicio',titulo:'Início',icone:LayoutDashboard},{rota:'/societario/clientes',titulo:'Societário',icone:Building2},{rota:'/fiscal/faturamento',titulo:'Fiscal',icone:ReceiptText},{rota:'/societario/tarefas',titulo:'Tarefas',icone:ListTodo},{rota:'/configuracoes',titulo:'Ajustes',icone:Settings2}].map(item=>{const Icone=item.icone;return <Link key={item.rota} href={item.rota} className={caminho===item.rota?'ativo':''}><Icone/>{item.titulo}</Link>})}</nav></>;
}
