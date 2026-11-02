'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentType, type PointerEvent, type KeyboardEvent } from 'react';
import { LayoutDashboard, Building2, ReceiptText, BookOpen, UsersRound, Wallet, Settings2, ListTodo, LogOut, ChevronDown, ChevronRight, LockKeyhole, Menu, X } from 'lucide-react';
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
    {titulo:'Visão geral',rota:'/fiscal/faturamento'},
    {titulo:'Faturamento MEI',rota:'/fiscal/faturamento/mei'},
    {titulo:'Faturamento convencional',rota:'/fiscal/faturamento/convencional'},
    {titulo:'Categorias',rota:'/fiscal/categorias'},
    {titulo:'Documentos fiscais',rota:'/fiscal/documentos'}, {titulo:'DAS MEI',rota:'/fiscal/das-mei'}, {titulo:'DASN-SIMEI',rota:'/fiscal/dasn-simei'},
  ]},
  {chave:'contabil',titulo:'Contábil',icone:BookOpen,funcoes:[{titulo:'Plano de contas'},{titulo:'Lançamentos'},{titulo:'Conciliação bancária'},{titulo:'Demonstrativos'}]},
  {chave:'folha',titulo:'Folha de pagamento',icone:UsersRound,funcoes:[{titulo:'Empregados',rota:'/folha/empregados'},{titulo:'Eventos',rota:'/folha/eventos'},{titulo:'Lançamentos',rota:'/folha/lancamentos'},{titulo:'Contracheques',rota:'/folha/contracheques'},{titulo:'Férias'}]},
  {chave:'financeiro',titulo:'Financeiro',icone:Wallet,funcoes:[{titulo:'Painel financeiro',rota:'/financeiro'},{titulo:'Honorários',rota:'/financeiro/honorarios'},{titulo:'Contas a receber',rota:'/financeiro/recebimentos'},{titulo:'Contas a pagar',rota:'/financeiro/despesas'},{titulo:'Movimentações',rota:'/financeiro/movimentacoes'},{titulo:'Contas e categorias',rota:'/financeiro/contas'},{titulo:'Fluxo de caixa',rota:'/financeiro/fluxo-de-caixa'},{titulo:'Relatórios',rota:'/financeiro/relatorios'}]},
];
const LARGURA_PADRAO=234;
const LARGURA_MINIMA=210;
const LARGURA_MAXIMA=390;
const CHAVE_LARGURA='on-erp:largura-menu';
const limitarLargura=(valor:number)=>Math.min(LARGURA_MAXIMA,Math.max(LARGURA_MINIMA,valor));

export function Navegacao(){
  const caminho=usePathname();
  const [menuMovelAberto, definirMenuMovelAberto] = useState(false);
  const [larguraLateral,definirLarguraLateral]=useState(LARGURA_PADRAO);
  const [preferenciaCarregada,definirPreferenciaCarregada]=useState(false);
  const arrasto=useRef<{x:number;largura:number}|null>(null);

  useEffect(()=>{
    try {
      const valor=Number(window.localStorage.getItem(CHAVE_LARGURA));
      if(Number.isFinite(valor)&&valor>=LARGURA_MINIMA&&valor<=LARGURA_MAXIMA)definirLarguraLateral(valor);
    } catch { /* Armazenamento pode estar indisponível; a navegação continua operando. */ }
    definirPreferenciaCarregada(true);
  },[]);
  useEffect(()=>{
    if(!preferenciaCarregada)return;
    try {window.localStorage.setItem(CHAVE_LARGURA,String(larguraLateral));}catch{/* Preferência local opcional. */}
  },[larguraLateral,preferenciaCarregada]);

  function iniciarArrasto(evento:PointerEvent<HTMLDivElement>){
    if(evento.button!==0)return;
    arrasto.current={x:evento.clientX,largura:larguraLateral};
    evento.currentTarget.setPointerCapture(evento.pointerId);
    evento.preventDefault();
  }
  function moverDivisor(evento:PointerEvent<HTMLDivElement>){
    if(!arrasto.current)return;
    definirLarguraLateral(limitarLargura(arrasto.current.largura+evento.clientX-arrasto.current.x));
  }
  function finalizarArrasto(evento:PointerEvent<HTMLDivElement>){
    arrasto.current=null;
    if(evento.currentTarget.hasPointerCapture(evento.pointerId))evento.currentTarget.releasePointerCapture(evento.pointerId);
  }
  function atalhosDivisor(evento:KeyboardEvent<HTMLDivElement>){
    let novaLargura:number;
    if(evento.key==='ArrowRight')novaLargura=larguraLateral+10;
    else if(evento.key==='ArrowLeft')novaLargura=larguraLateral-10;
    else if(evento.key==='Home')novaLargura=LARGURA_MINIMA;
    else if(evento.key==='End')novaLargura=LARGURA_MAXIMA;
    else return;
    evento.preventDefault();
    definirLarguraLateral(limitarLargura(novaLargura));
  }

  useEffect(()=>{definirMenuMovelAberto(false);},[caminho]);
  useEffect(()=>{if(!menuMovelAberto)return;const antes=document.body.style.overflow;document.body.style.overflow='hidden';const sair=(evento:globalThis.KeyboardEvent)=>{if(evento.key==='Escape')definirMenuMovelAberto(false);};document.addEventListener('keydown',sair);return()=>{document.body.style.overflow=antes;document.removeEventListener('keydown',sair);};},[menuMovelAberto]);
  const [abertos,definirAbertos]=useState<string[]>(()=>modulos.filter(item=>caminho.startsWith(`/${item.chave}`)).map(item=>item.chave));
  function alternar(chave:string){definirAbertos(atuais=>atuais.includes(chave)?atuais.filter(item=>item!==chave):[...atuais,chave]);}
  const conteudoMenu = <>
    <Link className="marca" href="/inicio" aria-label="On Contabilidade — início" onClick={()=>definirMenuMovelAberto(false)}><img src="/marca/on-contabilidade-clara.svg" alt="On Contabilidade"/></Link>
    <div className="titulo-menu">NAVEGAÇÃO</div>
    <nav aria-label="Módulos do ERP">
      <Link href="/inicio" onClick={()=>definirMenuMovelAberto(false)} className={`link-menu ${caminho==='/inicio'?'ativo':''}`}><LayoutDashboard/>Dashboard</Link>
      {modulos.map(modulo=>{const Icone=modulo.icone;const aberto=abertos.includes(modulo.chave);const ativo=caminho.startsWith(`/${modulo.chave}`);
        return <div className="grupo-menu" key={modulo.chave}>
          <button type="button" aria-expanded={aberto} className={`link-menu botao-modulo ${ativo?'ativo':''}`} onClick={()=>alternar(modulo.chave)}><Icone/><span>{modulo.titulo}</span>{aberto?<ChevronDown className="seta-menu"/>:<ChevronRight className="seta-menu"/>}</button>
          {aberto&&<div className="submenu" aria-label={`Funções de ${modulo.titulo}`}>{modulo.funcoes.map(funcao=>funcao.rota?<Link key={funcao.titulo} onClick={()=>definirMenuMovelAberto(false)} href={funcao.rota} className={`subitem-menu ${caminho===funcao.rota||caminho.startsWith(funcao.rota+'/')?'ativo':''}`}>{funcao.titulo}</Link>:<span key={funcao.titulo} className="subitem-menu desabilitado" title="Funcionalidade ainda não disponível">{funcao.titulo}<LockKeyhole size={11}/></span>)}</div>}
        </div>;
      })}
      <Link href="/configuracoes" onClick={()=>definirMenuMovelAberto(false)} className={`link-menu ${caminho.startsWith('/configuracoes')?'ativo':''}`}><Settings2/>Configurações</Link>
    </nav>
    <div className="rodape-menu"><button className="botao" type="button" onClick={async()=>{await criarClienteNavegador().auth.signOut();window.location.assign('/entrar');}}><LogOut size={14}/> Encerrar sessão</button></div>
  </>;
  const atalhosMoveis=[
    {chave:'inicio',rota:'/inicio',titulo:'Início',icone:LayoutDashboard},
    {chave:'societario',rota:'/societario',titulo:'Societário',icone:Building2},
    {chave:'fiscal',rota:'/fiscal',titulo:'Fiscal',icone:ReceiptText},
    {chave:'contabil',rota:null,titulo:'Contábil',icone:BookOpen},
    {chave:'folha',rota:'/folha',titulo:'Folha',icone:UsersRound},
    {chave:'financeiro',rota:'/financeiro',titulo:'Financeiro',icone:Wallet},
  ];
  function abrirModuloPendente(chave:string){
    definirAbertos(atuais=>atuais.includes(chave)?atuais:[...atuais,chave]);
    definirMenuMovelAberto(true);
  }
  return <>
    <aside className="lateral" style={{width:larguraLateral,flexBasis:larguraLateral}}>{conteudoMenu}
      <div className="redimensionador-lateral" role="separator" aria-label="Redimensionar menu lateral" aria-orientation="vertical" aria-controls="conteudo-principal" aria-valuemin={LARGURA_MINIMA} aria-valuemax={LARGURA_MAXIMA} aria-valuenow={larguraLateral} tabIndex={0} title="Arraste para ajustar a largura do menu" onPointerDown={iniciarArrasto} onPointerMove={moverDivisor} onPointerUp={finalizarArrasto} onPointerCancel={finalizarArrasto} onKeyDown={atalhosDivisor}/>
    </aside>
    <button className="botao-menu-mobile" type="button" onClick={()=>definirMenuMovelAberto(true)} aria-label="Abrir menu de módulos" aria-expanded={menuMovelAberto} aria-controls="menu-movel"><Menu size={22}/></button>
    {menuMovelAberto&&<div className="fundo-menu-movel" onMouseDown={evento=>{if(evento.target===evento.currentTarget)definirMenuMovelAberto(false);}}><aside id="menu-movel" className="gaveta-menu-movel" aria-label="Menu principal"><div className="gaveta-menu-cabecalho"><span>Módulos e funções</span><button type="button" onClick={()=>definirMenuMovelAberto(false)} aria-label="Fechar menu"><X size={22}/></button></div>{conteudoMenu}</aside></div>}
    <nav className="navegacao-mobile" aria-label="Módulos principais">{atalhosMoveis.map(item=>{const Icone=item.icone;const ativo=item.chave==='inicio'?caminho==='/inicio':caminho===`/${item.chave}`||caminho.startsWith(`/${item.chave}/`);return item.rota?<Link key={item.chave} href={item.rota} className={ativo?'ativo':''} aria-current={ativo?'page':undefined}><Icone aria-hidden="true"/><span>{item.titulo}</span></Link>:<button key={item.chave} type="button" className={menuMovelAberto&&abertos.includes(item.chave)?'ativo':''} onClick={()=>abrirModuloPendente(item.chave)} aria-label="Contábil — consultar funções no menu"><Icone aria-hidden="true"/><span>{item.titulo}</span></button>})}</nav>
  </>;
}
