/** Motor compartilhado de médias (13º e férias), somente recibos mensais CONFERIDOS.
 * Permite auditoria por competência; salários, adicionais e reflexos não são inferidos de total de proventos.
 */
import { arredondar, somarCentavos, type EventoCalculado } from './calculos';

export type FinalidadeMedia = '13'|'FERIAS';
export type ReciboParaMedia = {id:string; empregado_id:string; competencia:string; situacao:string; memoria_calculo:{eventos?:EventoCalculado[]}|null};
export type EventoParaMedia = {codigo:string; nome:string; tipo_evento:string; configuracao_calculo:Record<string,unknown>|null};
export type LinhaMedia = {competencia:string;codigo:string;descricao:string;valorHistorico:number;horas:number|null;percentual:number|null;criterio:'HORAS'|'VALOR'};
export type ResultadoMedias = {
 finalidade:FinalidadeMedia; inicio:string;fim:string;divisor:number;competencias:string[];
 totalHistorico:number;mediaMonetaria:number;mediaHorasValorizada:number;mediaTotal:number;
 linhas:LinhaMedia[];avisos:string[];pendencias:string[];
};
const cent=(v:number)=>Math.round((v+Math.sign(v)*1e-9)*100);
const money=(v:number)=>cent(v)/100;
export function listaCompetencias(inicio:string,fim:string):string[]{
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(inicio)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(fim)||inicio>fim)throw Error('Período inválido.');
 const out:string[]=[];let [y,m]=inicio.split('-').map(Number);const [yf,mf]=fim.split('-').map(Number);
 while(y<yf||(y===yf&&m<=mf)){out.push(`${y}-${String(m).padStart(2,'0')}`);if(out.length>24)throw Error('Período superior a 24 competências.');m++;if(m>12){y++;m=1;}}
 return out;
}
function tipoRubrica(e:EventoCalculado,cfg:Record<string,unknown>,finalidade:FinalidadeMedia):'HORAS'|'VALOR'|null{
 if(e.tipo!=='PROVENTO')return null;
 const chave=finalidade==='13'?'integra_media_13':'integra_media_ferias';
 if(cfg[chave]===false)return null;
 const repouso=/\b(dsr|rsr|repouso)\b/i.test(e.descricao);
 if(repouso&&/extra/i.test(e.descricao))return 'VALOR';
 const horas=/\bhoras?\s+extras?\b/i.test(e.descricao)||/\bextras?\s+horas?\b/i.test(e.descricao);
 if(horas) return 'HORAS';
 if(cfg[chave]===true&&cfg.tipo_referencia==='HORAS'&&Number(cfg.percentual_adicional)>0)return 'HORAS';
 if(cfg[chave]===true)return 'VALOR';
 // Legado: reflexo de DSR sobre horas extras, identificado por descrição explícita.
 if(/\b(dsr|rsr|repouso)\b/i.test(e.descricao)&&/extra/i.test(e.descricao))return 'VALOR';
 return null;
}
/** Consome cópias das memórias originais, sem alterar as folhas processadas. */
export function apurarMedias(entrada:{finalidade:FinalidadeMedia;inicio:string;fim:string;admissao:string;
 recibos:ReciboParaMedia[];eventos:EventoParaMedia[];salarioHoraAtual:number;
 incluirMesesSemFolha?:boolean}):ResultadoMedias {
 if(!Number.isFinite(entrada.salarioHoraAtual)||entrada.salarioHoraAtual<=0)throw Error('Salário-hora atual inválido.');
 const meses=listaCompetencias(entrada.inicio,entrada.fim).filter(c=>{
  const [ano,mes]=c.split('-').map(Number);const fimMes=new Date(Date.UTC(ano,mes,0)).getUTCDate();
  if(entrada.admissao.slice(0,7)>c)return false;
  if(entrada.admissao.slice(0,7)<c)return true;
  const dia=Number(entrada.admissao.slice(8));return fimMes-dia+1>=15;
 });
 if(!meses.length)return {finalidade:entrada.finalidade,inicio:entrada.inicio,fim:entrada.fim,divisor:0,competencias:[],totalHistorico:0,mediaMonetaria:0,mediaHorasValorizada:0,mediaTotal:0,linhas:[],avisos:['Admissão posterior ao período consultado: sem histórico de remuneração variável até esta competência.'],pendencias:[]};
 const porMes=new Map<string,ReciboParaMedia[]>();
 for(const r of entrada.recibos){const c=r.competencia.slice(0,7);if(!meses.includes(c))continue;
  const items=porMes.get(c)||[];items.push(r);porMes.set(c,items);}
 const pendencias:string[]=[];const linhas:LinhaMedia[]=[];const avisos:string[]=[];
 const catalogo=new Map(entrada.eventos.map(e=>[e.codigo,e]));
 for(const competencia of meses){
  const candidatos=porMes.get(competencia)||[];
  const validos=candidatos.filter(r=>r.situacao==='CONFERIDO');
  if(validos.length!==1){pendencias.push(`${competencia}: ${validos.length?'mais de um recibo conferido':'folha mensal não conferida'}`);continue;}
  const eventos=validos[0].memoria_calculo?.eventos;
  if(!Array.isArray(eventos)){pendencias.push(`${competencia}: memória de eventos ausente`);continue;}
  for(const e of eventos){
   const cfg=catalogo.get(e.codigo)?.configuracao_calculo||{};
   const criterio=tipoRubrica(e,cfg,entrada.finalidade);if(!criterio)continue;
   if(!Number.isFinite(e.valor)||e.valor<0){pendencias.push(`${competencia}: valor inválido em ${e.codigo}`);continue;}
   let horas:number|null=null,percentual:number|null=null;
   if(criterio==='HORAS'){
    // Ex.: '12,5h (50%)'; sem quantidade histórica, não estimar por valores monetários.
    const match=/^\s*([\d.,]+)h(?:\s*\((\d+(?:[.,]\d+)?)%\))?/i.exec(e.referencia||'');
    if(!match){pendencias.push(`${competencia}: horas/percentual históricos não encontrados em ${e.codigo} (${e.descricao})`);continue;}
    horas=Number(match[1].replace(',','.'));percentual=match[2]?Number(match[2].replace(',','.')):Number(cfg.percentual_adicional??0);
    if(!Number.isFinite(horas)||horas<0||!Number.isFinite(percentual)||percentual<0){pendencias.push(`${competencia}: referência inválida em ${e.codigo}`);continue;}
   }
   linhas.push({competencia,codigo:e.codigo,descricao:e.descricao,valorHistorico:money(e.valor),horas,percentual,criterio});
  }
 }
 const divisor=meses.length;
 const grupos=new Map<string,{horas:number;percentual:number}>();
 let monetaria=0;
 for(const l of linhas){
  if(l.criterio==='HORAS'){
   const chave=`${l.codigo}|${l.percentual}`;const grupo=grupos.get(chave)||{horas:0,percentual:l.percentual||0};grupo.horas+=(l.horas||0);grupos.set(chave,grupo);
  }else monetaria+=cent(l.valorHistorico);
 }
 const mediaMonetaria=money(monetaria/100/divisor);
 const mediaHorasValorizada=somarCentavos([...grupos.values()].map(g=>arredondar(g.horas/divisor*entrada.salarioHoraAtual*(1+g.percentual/100))));
 const totalHistorico=somarCentavos(linhas.map(l=>l.valorHistorico));
 if(entrada.finalidade==='13'&&entrada.fim.slice(5)!=='12')avisos.push(`Prévia do 13º com histórico até ${entrada.fim}; recalcular após dezembro e apurar eventual complemento.`);
 if(entrada.finalidade==='FERIAS')avisos.push('Conferir enquadramento da verba, período aquisitivo e convenção coletiva; férias ainda não possuem folha de pagamento automatizada.');
 if(!linhas.length)avisos.push('Nenhuma rubrica variável classificada neste período. Confira a parametrização dos eventos para não omitir médias.');
 return {finalidade:entrada.finalidade,inicio:entrada.inicio,fim:entrada.fim,divisor,competencias:meses,
  totalHistorico,mediaMonetaria,mediaHorasValorizada,mediaTotal:somarCentavos([mediaMonetaria,mediaHorasValorizada]),linhas,avisos,pendencias};
}
