'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, ReceiptText, BookOpen, UsersRound, Wallet, Settings2, ListTodo, Contact, LogOut } from 'lucide-react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';
const principais=[{rota:'/inicio',titulo:'Dashboard',icone:LayoutDashboard},{rota:'/societario/clientes',titulo:'Societário',icone:Building2},{rota:'/fiscal/faturamento',titulo:'Fiscal',icone:ReceiptText}];
const futuros=[{rota:'#',titulo:'Contábil',icone:BookOpen},{rota:'#',titulo:'Folha de pagamento',icone:UsersRound},{rota:'#',titulo:'Financeiro',icone:Wallet}];
export function Navegacao() {
  const caminho=usePathname();
  const itens=[...principais,...futuros,{rota:'/configuracoes',titulo:'Configurações',icone:Settings2}];
  return <><aside className="lateral"><Link className="marca" href="/inicio"><img src="/icons/on-erp.svg" alt="Símbolo da On Contabilidade"/><div><b>On ERP</b><span>CONTABILIDADE</span></div></Link>
    <div className="titulo-menu">GERENCIAMENTO</div><nav>{itens.map(item=>{const Icone=item.icone;const ativo=item.rota==='/inicio'?caminho==='/inicio':item.rota!== '#'&&caminho.startsWith(item.rota.split('/').slice(0,2).join('/'));return item.rota==='#'?<span key={item.titulo} className="link-menu" title="Planejado para próxima etapa" style={{opacity:.4,cursor:'not-allowed'}}><Icone/>{item.titulo}</span>:<Link key={item.titulo} href={item.rota} className={`link-menu ${ativo?'ativo':''}`}><Icone/>{item.titulo}</Link>})}</nav>
    <div className="titulo-menu">ACESSO RÁPIDO</div><Link className="link-menu" href="/societario/tarefas"><ListTodo/>Tarefas</Link><Link className="link-menu" href="/societario/clientes"><Contact/>Clientes</Link>
    <div className="rodape-menu"><button className="botao" onClick={async()=>{await criarClienteNavegador().auth.signOut();window.location.assign('/entrar');}}><LogOut size={14}/> Encerrar sessão</button><p style={{marginTop:15}}>On ERP • Versão inicial</p></div></aside>
    <nav className="navegacao-mobile">{[...principais,{rota:'/societario/tarefas',titulo:'Tarefas',icone:ListTodo}].map(item=>{const Icone=item.icone;return <Link key={item.rota} href={item.rota} className={caminho.startsWith(item.rota.split('/').slice(0,2).join('/'))?'ativo':''}><Icone/>{item.titulo}</Link>})}</nav></>;
}
