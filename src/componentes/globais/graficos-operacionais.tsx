import {moeda} from '@/lib/utilitarios/formatacao';

type Serie={rotulo:string;valor:number;cor?:string};
/** Barras acessíveis renderizadas no servidor, sempre derivadas de registros do módulo. */
export function GraficoBarras({titulo,itens,moedaValores=false,subtitulo}:{titulo:string;itens:Serie[];moedaValores?:boolean;subtitulo?:string}){
 const maior=Math.max(1,...itens.map(i=>Math.max(0,Number(i.valor)||0)));
 return <section className="cartao on-grafico"><div className="topo-cartao"><div><h2>{titulo}</h2>{subtitulo&&<p className="muted pequeno">{subtitulo}</p>}</div></div>
  {itens.length===0?<p className="muted pequeno">Sem registros para o período.</p>:<div className="on-grafico-lista">{itens.map((item,i)=><div className="on-grafico-linha" key={`${item.rotulo}-${i}`}><div className="on-grafico-legendas"><span>{item.rotulo}</span><strong>{moedaValores?moeda(item.valor):Number(item.valor).toLocaleString('pt-BR')}</strong></div><div className="on-grafico-trilha" role="img" aria-label={`${item.rotulo}: ${moedaValores?moeda(item.valor):item.valor}`}><span style={{width:`${Math.min(100,Math.max(0,item.valor)/maior*100)}%`,background:item.cor||'var(--verde)'}}/></div></div>)}</div>}
 </section>;
}
