import { type ReactNode } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { EntradaCompetencia } from '@/componentes/globais/competencia';
export function CabecalhoPagina({ titulo, descricao, acao, rotaAcao }: {titulo:string;descricao?:string;acao?:string;rotaAcao?:string}) {
  return <div className="titulo-pagina linha entre"><div><h1>{titulo}</h1>{descricao&&<p>{descricao}</p>}</div>{acao&&rotaAcao&&<Link className="botao primario" href={rotaAcao}><Plus size={15}/>{acao}</Link>}</div>;
}
export function Cartao({titulo,subtitulo,acoes,children}:{titulo?:string;subtitulo?:string;acoes?:ReactNode;children:ReactNode}) {
  return <section className="cartao">{titulo&&<div className="topo-cartao"><div><h2>{titulo}</h2>{subtitulo&&<p className="muted pequeno">{subtitulo}</p>}</div>{acoes}</div>}{children}</section>;
}
export function Indicador({legenda,valor,detalhe}:{legenda:string;valor:string|number;detalhe?:string}) {
  return <div className="cartao indicador"><div className="legenda">{legenda}</div><div className="valor">{valor}</div>{detalhe&&<div className="detalhe">{detalhe}</div>}</div>;
}
/** Rótulos de domínio centralizados; estados técnicos não são exibidos diretamente. */
export const ROTULOS_SITUACAO:Record<string,string>={
 ATIVO:'Ativo',ATIVA:'Ativa',INATIVO:'Inativo',INATIVA:'Inativa',CANCELADO:'Cancelado',CANCELADA:'Cancelada',
 CONCLUIDA:'Concluída',CONCLUIDO:'Concluído',PAGO:'Pago',PAGA:'Paga',RECEBIDO:'Recebido',EM_DIA:'Em dia',
 RISCO:'Em risco',PENDENTE:'Pendente',ONBOARDING:'Em implantação',AGUARDANDO_CLIENTE:'Aguardando cliente',
 EM_ANDAMENTO:'Em andamento',EM_EXECUCAO:'Em execução',A_FAZER:'A fazer',
 EM_CONFERENCIA:'Em conferência',CONFERIDO:'Conferido',REPROCESSAMENTO_PENDENTE:'Reprocessamento pendente',
 ABERTO:'Em aberto',ABERTA:'Em aberto',VENCIDO:'Vencido',VENCIDA:'Vencida',SUSPENSO:'Suspenso',
 ENCERRADO:'Encerrado',BAIXA:'Baixa',NORMAL:'Normal',ALTA:'Alta'
};
export function rotuloSituacao(valor:string){
 return ROTULOS_SITUACAO[valor]??valor.replaceAll('_',' ').toLocaleLowerCase('pt-BR').replace(/^./,letra=>letra.toLocaleUpperCase('pt-BR'));
}
export function Etiqueta({valor}:{valor:string}) {
  const cor=['ATIVO','CONCLUIDA','CONCLUIDO','PAGO','RECEBIDO','EM_DIA'].includes(valor)?'verde':
    ['RISCO','PENDENTE','ONBOARDING','AGUARDANDO_CLIENTE','EM_ANDAMENTO','EM_EXECUCAO'].includes(valor)?'amarelo':
    ['INATIVO','CANCELADO','VENCIDO'].includes(valor)?'vermelho':'azul';
  return <span className={`etiqueta ${cor}`}>{rotuloSituacao(valor)}</span>;
}
export function Mensagem({erro,sucesso}:{erro?:string;sucesso?:string}) { if (!erro&&!sucesso)return null; return <div className={`mensagem ${erro?'erro':'sucesso'}`}>{erro||sucesso}</div>; }
export function Campo({rotulo,nome,tipo='text',padrao,obrigatorio=false,opcoes,placeholder,step,min,max}:{rotulo:string;nome:string;tipo?:string;padrao?:string|number|null;obrigatorio?:boolean;opcoes?:{valor:string;rotulo:string}[];placeholder?:string;step?:string;min?:string;max?:string}) {
  return <div className="campo"><label htmlFor={nome}>{rotulo}{obrigatorio?' *':''}</label>{tipo==='month'?<EntradaCompetencia nome={nome} id={nome} padrao={padrao?.toString()} obrigatorio={obrigatorio}/>:opcoes?<select name={nome} id={nome} defaultValue={padrao??''} required={obrigatorio}>{!obrigatorio&&<option value="">Selecione</option>}{opcoes.map(opcao=><option value={opcao.valor} key={opcao.valor}>{opcao.rotulo}</option>)}</select>:<input name={nome} id={nome} type={tipo} defaultValue={padrao??''} required={obrigatorio} placeholder={placeholder} step={step} min={min} max={max}/>}</div>;
}
export function SeletorMes({mes,base}:{mes:string;base:string}) {
  return <form action={base} className="campo"><label htmlFor="competencia">Competência</label><EntradaCompetencia id="competencia" nome="competencia" padrao={mes} obrigatorio/><button className="botao" type="submit">Aplicar</button></form>;
}
export function ListaVazia({texto='Nenhum registro disponível para os filtros selecionados.'}:{texto?:string}) { return <div className="vazio">{texto}</div>; }
