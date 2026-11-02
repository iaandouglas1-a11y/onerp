'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ComponentType, type PointerEvent, type KeyboardEvent } from 'react';
import { LayoutDashboard, Building2, ReceiptText, BookOpen, UsersRound, Wallet, Settings2, ListTodo, LogOut, ChevronDown, ChevronRight, LockKeyhole, Menu, X } from 'lucide-react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';

type IconeMenu=ComponentType<{size?:number;strokeWidth?:number}>;
type FuncaoMenu={titulo:string;rota?:string;destacar?:boolean};
type GrupoFuncoes={titulo:string;funcoes:FuncaoMenu[]};
type ModuloMenu={chave:string;titulo:string;icone:IconeMenu;grupos:GrupoFuncoes[]};
// Menu de navegação: as funcionalidades sem rota permanecem identificadas como futuras.
// Nenhuma rota ou regra operacional é criada por esta organização visual.
const modulos:ModuloMenu[]=[
  {chave:'societario',titulo:'Societário',icone:Building2,grupos:[
    {titulo:'Visão geral',funcoes:[{titulo:'Painel societário'}]},
    {titulo:'Gestão de clientes',funcoes:[{titulo:'Clientes',rota:'/societario/clientes'},{titulo:'Contatos e representantes'},{titulo:'Serviços contratados'}]},
    {titulo:'Gestão operacional',funcoes:[{titulo:'Obrigações',rota:'/societario/obrigacoes'},{titulo:'Tarefas',rota:'/societario/tarefas'},{titulo:'Implantação de clientes'}]},
    {titulo:'Documentação',funcoes:[{titulo:'Documentos e contratos',rota:'/societario/documentos'},{titulo:'Acessos e credenciais',rota:'/societario/acessos'}]},
    {titulo:'Configurações',funcoes:[{titulo:'Catálogo de serviços',rota:'/societario/servicos'}]},
  ]},
  {chave:'fiscal',titulo:'Fiscal',icone:ReceiptText,grupos:[
    {titulo:'Visão geral',funcoes:[{titulo:'Painel fiscal',rota:'/fiscal',destacar:false}]},
    {titulo:'Documentos fiscais',funcoes:[{titulo:'Consultar documentos',rota:'/fiscal/documentos'},{titulo:'Importar documentos',rota:'/fiscal/documentos?novo=1',destacar:false},{titulo:'Conferência e classificação'}]},
    {titulo:'Faturamento',funcoes:[{titulo:'Faturamento geral',rota:'/fiscal/faturamento'},{titulo:'Faturamento MEI',rota:'/fiscal/faturamento/mei'},{titulo:'Faturamento convencional',rota:'/fiscal/faturamento/convencional'}]},
    {titulo:'Obrigações',funcoes:[{titulo:'DAS MEI',rota:'/fiscal/das-mei'},{titulo:'DASN-SIMEI',rota:'/fiscal/dasn-simei'}]},
    {titulo:'Configurações',funcoes:[{titulo:'Categorias fiscais',rota:'/fiscal/categorias'},{titulo:'Regras de classificação'}]},
  ]},
  {chave:'contabil',titulo:'Contábil',icone:BookOpen,grupos:[
    {titulo:'Visão geral',funcoes:[{titulo:'Painel contábil'}]},
    {titulo:'Estrutura contábil',funcoes:[{titulo:'Plano de contas'},{titulo:'Históricos padrão'}]},
    {titulo:'Escrituração',funcoes:[{titulo:'Lançamentos contábeis'},{titulo:'Importação de lançamentos'}]},
    {titulo:'Conciliação',funcoes:[{titulo:'Extratos bancários'},{titulo:'Conciliação bancária'}]},
    {titulo:'Demonstrativos',funcoes:[{titulo:'Balancete'},{titulo:'Razão'},{titulo:'Diário'},{titulo:'Balanço Patrimonial'},{titulo:'DRE'}]},
    {titulo:'Encerramento',funcoes:[{titulo:'Períodos e fechamento contábil'}]},
  ]},
  {chave:'folha',titulo:'Folha de pagamento',icone:UsersRound,grupos:[
    {titulo:'Visão geral',funcoes:[{titulo:'Painel da folha'}]},
    {titulo:'Cadastros',funcoes:[{titulo:'Empregados',rota:'/folha/empregados'},{titulo:'Eventos',rota:'/folha/eventos'}]},
    {titulo:'Movimentações',funcoes:[{titulo:'Lançamentos por competência',rota:'/folha/lancamentos'}]},
    {titulo:'Processamento',funcoes:[{titulo:'Processamento e contracheques',rota:'/folha/contracheques'}]},
    {titulo:'Gestão trabalhista',funcoes:[{titulo:'Férias'},{titulo:'Documentos trabalhistas'}]},
    {titulo:'Consultas',funcoes:[{titulo:'Histórico e relatórios'}]},
    {titulo:'Configurações',funcoes:[{titulo:'Parâmetros de cálculo',rota:'/folha/contracheques',destacar:false}]},
  ]},
  {chave:'financeiro',titulo:'Financeiro',icone:Wallet,grupos:[
    {titulo:'Visão geral',funcoes:[{titulo:'Painel financeiro',rota:'/financeiro'}]},
    {titulo:'Receitas',funcoes:[{titulo:'Honorários',rota:'/financeiro/honorarios'},{titulo:'Contas a receber',rota:'/financeiro/recebimentos'}]},
    {titulo:'Despesas',funcoes:[{titulo:'Contas a pagar',rota:'/financeiro/despesas'}]},
    {titulo:'Tesouraria',funcoes:[{titulo:'Movimentações',rota:'/financeiro/movimentacoes'},{titulo:'Contas bancárias e caixa',rota:'/financeiro/contas'}]},
    {titulo:'Gestão e análise',funcoes:[{titulo:'Fluxo de caixa',rota:'/financeiro/fluxo-de-caixa'},{titulo:'Relatórios gerenciais',rota:'/financeiro/relatorios'}]},
    {titulo:'Configurações',funcoes:[{titulo:'Categorias financeiras',rota:'/financeiro/contas',destacar:false}]},
  ]},
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
          {aberto&&<div className="submenu" aria-label={`Funções de ${modulo.titulo}`}>
            {modulo.grupos.map(grupo=><div key={grupo.titulo} className="submenu-grupo">
              <div className="submenu-titulo">{grupo.titulo}</div>
              {grupo.funcoes.map(funcao=>{
                const rotaBase=funcao.rota?.split('?')[0];
                const selecionado=funcao.destacar!==false&&!!rotaBase&&(caminho===rotaBase||rotaBase!=='/fiscal'&&rotaBase!=='/financeiro'&&rotaBase!=='/fiscal/faturamento'&&caminho.startsWith(rotaBase+'/'));
                return funcao.rota?<Link key={funcao.titulo} onClick={()=>definirMenuMovelAberto(false)} href={funcao.rota} className={`subitem-menu ${selecionado?'ativo':''}`}>{funcao.titulo}</Link>:<span key={funcao.titulo} className="subitem-menu desabilitado" title="Funcionalidade ainda não disponível">{funcao.titulo}<LockKeyhole size={11}/></span>;
              })}
            </div>)}
          </div>}
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
