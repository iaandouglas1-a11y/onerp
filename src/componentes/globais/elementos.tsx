import { type ReactNode } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
export function CabecalhoPagina({ titulo, descricao, acao, rotaAcao }: {titulo:string;descricao?:string;acao?:string;rotaAcao?:string}) {
  return <div className="titulo-pagina linha entre"><div><h1>{titulo}</h1>{descricao&&<p>{descricao}</p>}</div>{acao&&rotaAcao&&<Link className="botao primario" href={rotaAcao}><Plus size={15}/>{acao}</Link>}</div>;
}
export function Cartao({titulo,subtitulo,acoes,children}:{titulo?:string;subtitulo?:string;acoes?:ReactNode;children:ReactNode}) {
  return <section className="cartao">{titulo&&<div className="topo-cartao"><div><h2>{titulo}</h2>{subtitulo&&<p className="muted pequeno">{subtitulo}</p>}</div>{acoes}</div>}{children}</section>;
}
export function Indicador({legenda,valor,detalhe}:{legenda:string;valor:string|number;detalhe?:string}) {
  return <div className="cartao indicador"><div className="legenda">{legenda}</div><div className="valor">{valor}</div>{detalhe&&<div className="detalhe">{detalhe}</div>}</div>;
}
export function Etiqueta({valor}:{valor:string}) {
  const cor=['ATIVO','CONCLUIDA','CONCLUIDO','PAGO','RECEBIDO','EM_DIA'].includes(valor)?'verde':
    ['RISCO','PENDENTE','ONBOARDING','AGUARDANDO_CLIENTE','EM_ANDAMENTO','EM_EXECUCAO'].includes(valor)?'amarelo':
    ['INATIVO','CANCELADO','VENCIDO'].includes(valor)?'vermelho':'azul';
  return <span className={`etiqueta ${cor}`}>{valor.replaceAll('_',' ').toLowerCase().replace(/^./,letra=>letra.toUpperCase())}</span>;
}
export function Mensagem({erro,sucesso}:{erro?:string;sucesso?:string}) { if (!erro&&!sucesso)return null; return <div className={`mensagem ${erro?'erro':'sucesso'}`}>{erro||sucesso}</div>; }
export function Campo({rotulo,nome,tipo='text',padrao,obrigatorio=false,opcoes,placeholder,step,min,max}:{rotulo:string;nome:string;tipo?:string;padrao?:string|number|null;obrigatorio?:boolean;opcoes?:{valor:string;rotulo:string}[];placeholder?:string;step?:string;min?:string;max?:string}) {
  return <div className="campo"><label htmlFor={nome}>{rotulo}{obrigatorio?' *':''}</label>{opcoes?<select name={nome} id={nome} defaultValue={padrao??''} required={obrigatorio}>{!obrigatorio&&<option value="">Selecione</option>}{opcoes.map(opcao=><option value={opcao.valor} key={opcao.valor}>{opcao.rotulo}</option>)}</select>:<input name={nome} id={nome} type={tipo} defaultValue={padrao??''} required={obrigatorio} placeholder={placeholder} step={step} min={min} max={max}/>}</div>;
}
export function SeletorMes({mes,base}:{mes:string;base:string}) {
  return <form action={base} className="campo"><label htmlFor="competencia">Competência</label><input id="competencia" className="entrada" name="competencia" type="month" defaultValue={mes} onChange={undefined}/><button className="botao" type="submit">Aplicar</button></form>;
}
export function ListaVazia({texto='Nenhum registro encontrado.'}:{texto?:string}) { return <div className="vazio">{texto}</div>; }
