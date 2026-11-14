import Link from 'next/link';
import {CabecalhoPagina,Cartao,Campo} from '@/componentes/globais/elementos';
import {listarClientes} from '@/modulos/societario/consultas';
import {listarEmpregados} from '@/modulos/folha/consultas';
import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {mediasEmpregados} from '@/modulos/folha/consultas-medias';
import {moeda} from '@/lib/utilitarios/formatacao';

export default async function PaginaMedias({searchParams}:{searchParams:Promise<{cliente?:string;inicio?:string;fim?:string;empregado?:string}>}){
 const q=await searchParams;
 const [clientes,empregados,{banco,escritorioId}]=await Promise.all([listarClientes(),listarEmpregados(),exigirEscritorio()]);
 const clienteId=q.cliente&&clientes.some(c=>c.id===q.cliente)?q.cliente:clientes[0]?.id||'';
 const empregadosEmpresa=empregados.filter(e=>e.cliente_id===clienteId);
 const empregadoId=q.empregado&&empregadosEmpresa.some(e=>e.id===q.empregado)?q.empregado:empregadosEmpresa[0]?.id||'';
 const empregado=empregadosEmpresa.find(e=>e.id===empregadoId);
 const mesValido=(x:string|undefined)=>!!x&&/^\d{4}-(0[1-9]|1[0-2])$/.test(x);
 const inicio=mesValido(q.inicio)?q.inicio!:'2026-01';
 const fim=mesValido(q.fim)?q.fim!:'2026-10';
 let resultado:Awaited<ReturnType<typeof mediasEmpregados>>|null=null;let erro='';
 if(empregado){
  try{resultado=await mediasEmpregados(banco,escritorioId,clienteId,[empregado],'FERIAS',inicio,fim);}
  catch(e){erro=e instanceof Error?e.message:String(e);}
 }
 const media=resultado?.get(empregadoId);
 return <><CabecalhoPagina titulo="Médias trabalhistas — férias" descricao="Memória detalhada por empregado, baseada em contracheques mensais conferidos."/>
 <form method="get" className="filtros"><Campo nome="cliente" rotulo="Empresa" padrao={clienteId} opcoes={clientes.map(c=>({valor:c.id,rotulo:c.razao_social}))}/>
 <Campo nome="empregado" rotulo="Empregado" padrao={empregadoId} opcoes={empregadosEmpresa.map(e=>({valor:e.id,rotulo:e.nome_completo}))}/>
 <Campo nome="inicio" rotulo="Início do período aquisitivo (mês)" padrao={inicio} placeholder="AAAA-MM"/>
 <Campo nome="fim" rotulo="Fim do período aquisitivo (mês)" padrao={fim} placeholder="AAAA-MM"/>
 <button type="submit" className="botao primario">Consultar</button><Link className="botao" href="/folha/decimo-terceiro">13º salário</Link></form>
 <div className="aviso-configuracao">Informe as competências do período aquisitivo do empregado. A média considera somente folhas conferidas; cada mês sem horas extras participa do divisor. A apuração de férias depende do tipo de verba (art. 142 da CLT), de acordos coletivos, do período aquisitivo exato e de eventuais afastamentos. Este painel não emite recibo de férias.</div>
 {erro&&<div className="aviso-configuracao">{erro}</div>}
 {media&&<><Cartao titulo="Memória das médias — férias"><div className="grade colunas-4"><div><strong>Meses</strong><p>{media.divisor}</p></div><div><strong>Horas extras (média)</strong><p>{moeda(media.mediaHorasValorizada)}</p></div><div><strong>Outras verbas (média)</strong><p>{moeda(media.mediaMonetaria)}</p></div><div><strong>Média total</strong><p>{moeda(media.mediaTotal)}</p></div></div>
 {media.pendencias.length>0&&<p className="aviso-configuracao">Pendências impedem uso automático: {media.pendencias.join('; ')}</p>}
 {media.avisos.map((aviso,i)=><p className="aviso-configuracao" key={i}>{aviso}</p>)}
 <div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Competência</th><th>Rubrica</th><th>Histórico</th><th>Horas</th><th>Adicional</th><th>Critério</th></tr></thead><tbody>{media.linhas.map((l,i)=><tr key={`${l.competencia}-${l.codigo}-${i}`}><td>{l.competencia}</td><td>{l.codigo} — {l.descricao}</td><td>{moeda(l.valorHistorico)}</td><td>{l.horas??'—'}</td><td>{l.percentual!=null?`${l.percentual}%`:'—'}</td><td>{l.criterio}</td></tr>)}</tbody></table></div></Cartao></>}
 </>;
}
