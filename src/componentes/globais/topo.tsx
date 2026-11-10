'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, ChevronDown, LayoutDashboard, Building2, ReceiptText, BookOpen, UsersRound, Wallet, Settings2, LogOut } from 'lucide-react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';

const modulos = [
  { titulo: 'Societário', rota: '/societario', icone: Building2, itens: [
    ['Clientes', '/societario/clientes'], ['Obrigações', '/societario/obrigacoes'], ['Tarefas', '/societario/tarefas'], ['Documentos', '/societario/documentos'], ['Acessos', '/societario/acessos'], ['Serviços', '/societario/servicos']
  ] },
  { titulo: 'Fiscal', rota: '/fiscal', icone: ReceiptText, itens: [
    ['Visão geral', '/fiscal'], ['Documentos fiscais', '/fiscal/documentos'], ['Faturamento', '/fiscal/faturamento'], ['Faturamento MEI', '/fiscal/faturamento/mei'], ['DAS MEI', '/fiscal/das-mei'], ['DASN-SIMEI', '/fiscal/dasn-simei'], ['Débitos fiscais', '/fiscal/debitos'], ['Categorias fiscais', '/fiscal/categorias']
  ] },
  { titulo: 'Contábil', rota: '', icone: BookOpen, itens: [] },
  { titulo: 'Folha', rota: '/folha', icone: UsersRound, itens: [
    ['Visão geral', '/folha'], ['Empregados', '/folha/empregados'], ['Eventos', '/folha/eventos'], ['Lançamentos', '/folha/lancamentos'], ['Contracheques', '/folha/contracheques']
  ] },
  { titulo: 'Financeiro', rota: '/financeiro', icone: Wallet, itens: [
    ['Visão geral', '/financeiro'], ['Honorários', '/financeiro/honorarios'], ['Recebimentos', '/financeiro/recebimentos'], ['Despesas', '/financeiro/despesas'], ['Movimentações', '/financeiro/movimentacoes'], ['Contas', '/financeiro/contas'], ['Fluxo de caixa', '/financeiro/fluxo-de-caixa'], ['Relatórios', '/financeiro/relatorios']
  ] },
] as const;

export function Topo({email,nomeEscritorio}:{email:string;nomeEscritorio:string}) {
  const caminho = usePathname();
  const [aberto,setAberto] = useState<string|null>(null);
  useEffect(()=>{setAberto(null);},[caminho]);
  useEffect(()=>{
    if(!aberto)return;
    function fechar(evento:KeyboardEvent){if(evento.key==='Escape')setAberto(null);}
    function clique(evento:MouseEvent){if(evento.target instanceof Element&&!evento.target.closest('.on-menu-modulo'))setAberto(null);}
    document.addEventListener('keydown',fechar);
    document.addEventListener('click',clique);
    return ()=>{document.removeEventListener('keydown',fechar);document.removeEventListener('click',clique);};
  },[aberto]);
  const letra=(email[0]||'O').toUpperCase();
  return <header className="topo on-topo-novo">
    <Link className="on-marca-superior" href="/inicio" aria-label="On ERP — início"><img src="/marca/on-contabilidade-escura.svg" alt="On Contabilidade"/><span className="on-marca-divisor"/><span className="on-marca-nome">ERP</span></Link>
    <nav className="on-menu-superior" aria-label="Navegação principal">
      <Link className={`on-item-superior ${caminho==='/inicio'?'on-ativo':''}`} href="/inicio"><LayoutDashboard size={16}/> Dashboard</Link>
      {modulos.map(modulo=>{
        const Icone=modulo.icone; const ativo=!!modulo.rota&&(caminho===modulo.rota||caminho.startsWith(modulo.rota+'/'));
        return <div className="on-menu-modulo" key={modulo.titulo}>
          {modulo.itens.length ? <button type="button" aria-expanded={aberto===modulo.titulo} className={`on-item-superior ${ativo?'on-ativo':''}`} onClick={()=>setAberto(aberto===modulo.titulo?null:modulo.titulo)}><Icone size={16}/>{modulo.titulo}<ChevronDown size={14}/></button>:
            <span className="on-item-superior on-indisponivel" title="Módulo em preparação"><Icone size={16}/>{modulo.titulo}</span>}
          {aberto===modulo.titulo&&modulo.itens.length>0&&<div className="on-menu-dropdown" role="menu"><div className="on-menu-dropdown-titulo">{modulo.titulo}</div>{modulo.itens.map(([titulo,rota])=><Link href={rota} key={rota} role="menuitem" className={caminho===rota?'on-selecionado':''} onClick={()=>setAberto(null)}>{titulo}</Link>)}</div>}
        </div>;
      })}
    </nav>
    <div className="topo-direita on-acoes-superior">
      <span className="on-escritorio visivel-desktop" title={nomeEscritorio}>{nomeEscritorio}</span>
      <Link href="/configuracoes" className="on-icone-acao" aria-label="Configurações"><Settings2 size={18}/></Link>
      <span className="on-icone-acao" title="Notificações"><Bell size={18}/></span>
      <div className="usuario" title={email}><span className="avatar">{letra}</span><span className="on-email">{email}</span></div>
      <button className="on-sair" type="button" title="Encerrar sessão" aria-label="Encerrar sessão" onClick={async()=>{await criarClienteNavegador().auth.signOut();window.location.assign('/entrar');}}><LogOut size={17}/></button>
    </div>
  </header>;
}
