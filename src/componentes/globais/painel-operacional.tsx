'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowUpRight, CalendarClock, ChartColumnIncreasing, ClipboardList, FileText, ShieldCheck} from 'lucide-react';

type Secao={titulo:string;subtitulo:string;acoes:{texto:string;rota:string}[];atencao:string;analise:{texto:string;rota:string}};
const secoes:Record<string,Secao>={
 inicio:{titulo:'Central operacional',subtitulo:'Acesso às prioridades do escritório',acoes:[{texto:'Tarefas pendentes',rota:'/societario/tarefas'},{texto:'Obrigações',rota:'/societario/obrigacoes'},{texto:'Cobranças',rota:'/financeiro/recebimentos'}],atencao:'Consulte as tarefas e obrigações próximas do prazo para priorizar o atendimento.',analise:{texto:'Relatórios financeiros',rota:'/financeiro/relatorios'}},
 societario:{titulo:'Carteira de clientes',subtitulo:'Operação societária e cadastros',acoes:[{texto:'Clientes',rota:'/societario/clientes'},{texto:'Tarefas',rota:'/societario/tarefas'},{texto:'Obrigações',rota:'/societario/obrigacoes'},{texto:'Documentos',rota:'/societario/documentos'}],atencao:'Revise cadastros em implantação e clientes em risco antes de novos atendimentos.',analise:{texto:'Serviços cadastrados',rota:'/societario/servicos'}},
 fiscal:{titulo:'Gestão fiscal',subtitulo:'Receitas, apurações e pendências',acoes:[{texto:'Faturamento MEI',rota:'/fiscal/faturamento/mei'},{texto:'Débitos fiscais',rota:'/fiscal/debitos'},{texto:'DAS MEI',rota:'/fiscal/das-mei'},{texto:'Documentos fiscais',rota:'/fiscal/documentos'}],atencao:'Confira os vencimentos e a emissão das guias oficiais antes de considerar obrigações quitadas.',analise:{texto:'Faturamento mensal',rota:'/fiscal/faturamento'}},
 folha:{titulo:'Departamento pessoal',subtitulo:'Vínculos e eventos da folha',acoes:[{texto:'Empregados',rota:'/folha/empregados'},{texto:'Eventos',rota:'/folha/eventos'},{texto:'Lançamentos',rota:'/folha/lancamentos'},{texto:'Contracheques',rota:'/folha/contracheques'}],atencao:'Confira vínculos, competência e eventos registrados antes de emitir contracheques.',analise:{texto:'Consultar eventos',rota:'/folha/eventos'}},
 financeiro:{titulo:'Gestão financeira',subtitulo:'Cobranças, caixa e recorrência',acoes:[{texto:'Honorários',rota:'/financeiro/honorarios'},{texto:'Contas a receber',rota:'/financeiro/recebimentos'},{texto:'Despesas',rota:'/financeiro/despesas'},{texto:'Fluxo de caixa',rota:'/financeiro/fluxo-de-caixa'}],atencao:'Priorize as cobranças vencidas e acompanhe a diferença entre receita contratada e recebida.',analise:{texto:'Relatórios gerenciais',rota:'/financeiro/relatorios'}},
 configuracoes:{titulo:'Administração',subtitulo:'Parâmetros do escritório',acoes:[{texto:'Configurações',rota:'/configuracoes'},{texto:'Clientes',rota:'/societario/clientes'}],atencao:'Revise os parâmetros gerais antes de emitir relatórios fiscais.',analise:{texto:'Visão geral',rota:'/inicio'}}
};
export function PainelOperacional(){
 const caminho=usePathname()||'/inicio';const chave=caminho.split('/')[1]||'inicio';const secao=secoes[chave]||secoes.inicio;
 return <aside className="on-painel-operacional" aria-label={`Apoio operacional: ${secao.titulo}`}>
  <section className="on-painel-bloco"><div className="on-painel-icone"><ClipboardList size={19}/></div><h2>{secao.titulo}</h2><p>{secao.subtitulo}</p><div className="on-painel-links">{secao.acoes.map(a=><Link key={a.rota} href={a.rota} aria-current={caminho===a.rota?'page':undefined}>{a.texto}<ArrowUpRight size={15}/></Link>)}</div></section>
  <section className="on-painel-bloco"><div className="on-painel-titulo"><CalendarClock size={17}/> Ponto de atenção</div><p>{secao.atencao}</p></section>
  <section className="on-painel-bloco"><div className="on-painel-titulo"><ChartColumnIncreasing size={17}/> Análises e relatórios</div><Link className="on-painel-link" href={secao.analise.rota}>{secao.analise.texto}<ArrowUpRight size={15}/></Link></section>
  <div className="on-painel-rodape"><ShieldCheck size={16}/> Painel de consulta · sem alterações nos registros</div>
 </aside>;
}
