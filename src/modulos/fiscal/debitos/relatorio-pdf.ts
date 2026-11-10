import 'server-only';
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {moeda,dataBrasileira,formatarDocumento,formatarCompetencia} from '@/lib/utilitarios/formatacao';
import {calcularDebito,consolidarDebitos,type DebitoFiscal,type TaxaSelic} from './calculos';

const COR={texto:rgb(.039,.067,.110),verde:rgb(.486,.725,.235),vermelho:rgb(.82,.239,.239),cinza:rgb(.604,.647,.706),claro:rgb(.957,.965,.973),borda:rgb(.82,.85,.88),branco:rgb(1,1,1)};
const seguro=(valor:unknown)=>String(valor??'').replace(/[‐-―]/g,'-').replace(/[•]/g,'-').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();
const abreviar=(texto:string,fonte:PDFFont,tamanho:number,limite:number)=>{let s=seguro(texto);if(fonte.widthOfTextAtSize(s,tamanho)<=limite)return s;while(s.length&&fonte.widthOfTextAtSize(`${s}...`,tamanho)>limite)s=s.slice(0,-1);return `${s}...`;};

export async function gerarRelatorioDebitosPdf(cliente:{razao_social:string;cpf_cnpj:string},debitos:DebitoFiscal[],taxas:TaxaSelic[],hoje:string){
 const documento=await PDFDocument.create();documento.setTitle(`RELATÓRIO DE DÉBITOS - ${cliente.razao_social.toLocaleUpperCase('pt-BR')}`);documento.setAuthor('On Contabilidade');
 const normal=await documento.embedFont(StandardFonts.Helvetica);const forte=await documento.embedFont(StandardFonts.HelveticaBold);
 const logo=await documento.embedPng(await readFile(join(process.cwd(),'public','marca','on-contabilidade-relatorios-branca.png')));
 const ativos=debitos.filter(d=>d.situacao==='ABERTO');const resumo=consolidarDebitos(ativos,taxas,hoje);
 const W=595.28,H=841.89,margem=38,largura=W-2*margem,baseRodape=53;
 let pagina:PDFPage=documento.addPage([W,H]);let y=0;let contador=0;
 function escrever(valor:unknown,x:number,altura:number,tamanho=9,fonte:PDFFont=normal,cor=COR.texto){pagina.drawText(seguro(valor),{x,y:altura,size:tamanho,font:fonte,color:cor});}
 function direita(valor:unknown,extremo:number,altura:number,tamanho=9,fonte:PDFFont=normal,cor=COR.texto){const s=seguro(valor);escrever(s,extremo-fonte.widthOfTextAtSize(s,tamanho),altura,tamanho,fonte,cor);}
 function retangulo(x:number,altura:number,w:number,h:number,cor=COR.claro){pagina.drawRectangle({x,y:altura,width:w,height:h,color:cor});}
 function novaPagina(){if(contador++)pagina=documento.addPage([W,H]);retangulo(0,H-6,W,6,COR.verde);const lw=86;pagina.drawImage(logo,{x:margem,y:762,width:lw,height:lw*logo.height/logo.width});escrever('RELATÓRIO DE DÉBITOS',margem+lw+18,795,13,forte);escrever(`Atualizado em ${dataBrasileira(hoje)}`,margem+lw+18,778,9,normal,COR.cinza);pagina.drawLine({start:{x:margem,y:741},end:{x:W-margem,y:741},thickness:.7,color:COR.borda});y=719;}
 function garantia(altura:number){if(y-altura<baseRodape)novaPagina();}
 function tabelaCabecalho(){retangulo(margem,y-27,largura,27);const col=[['DÉBITO / COMP.',6],['VENC.',213],['PRINCIPAL',271],['ACRÉSC.',361],['TOTAL',454]] as const;for(const [nome,offset] of col)escrever(nome,margem+offset,y-18,7.6,forte);y-=27;}
 novaPagina();
 escrever('CLIENTE',margem,719,8,forte,COR.cinza);escrever(abreviar(cliente.razao_social.toLocaleUpperCase('pt-BR'),forte,11,largura),margem,700,11,forte);escrever(`CPF/CNPJ: ${formatarDocumento(cliente.cpf_cnpj)}`,margem,682,9,normal,COR.cinza);
 escrever('Resumo do período',margem,648,11,forte);
 const separacao=9,cardW=(largura-2*separacao)/3;
 const indicadores=[{titulo:'Total em aberto',valor:resumo.totalPrincipal,cor:COR.texto},{titulo:'Vencidos',valor:resumo.vencidoPrincipal,cor:COR.vermelho},{titulo:'A vencer',valor:resumo.vencerPrincipal,cor:COR.verde}];
 for(let i=0;i<indicadores.length;i++){const item=indicadores[i],x=margem+i*(cardW+separacao);retangulo(x,565,cardW,65);escrever(item.titulo,x+11,608,8,normal,COR.cinza);escrever(abreviar(moeda(item.valor),forte,12,cardW-19),x+11,584,12,forte,item.cor);}
 escrever('Total com acréscimos',margem,539,10,forte);
 escrever(resumo.totalAtualizado===null?'Aguardando índices Selic':moeda(resumo.totalAtualizado),margem,521,13,forte,resumo.incompletos?COR.vermelho:COR.texto);
 escrever('Cálculo estimado até a data de referência; prevalece a guia oficial.',margem,504,8,normal,COR.cinza);
 escrever('Débitos registrados',margem,469,11,forte);y=452;tabelaCabecalho();
 if(!ativos.length){escrever('Nenhum débito em aberto.',margem+6,y-17,9,normal,COR.cinza);y-=35;}
 for(let i=0;i<ativos.length;i++){
  const d=ativos[i];const calc=calcularDebito(d,taxas,hoje);const alturaLinha=27;
  if(y-alturaLinha<baseRodape){novaPagina();escrever('Débitos registrados (continuação)',margem,y,11,forte);y-=22;tabelaCabecalho();}
  if(i%2)retangulo(margem,y-alturaLinha,largura,alturaLinha,rgb(.986,.99,.992));
  const nome= d.descricao||d.tipo_debito.replaceAll('_',' ');
  escrever(abreviar(nome,forte,7.5,201),margem+6,y-11,7.5,forte);
  escrever(abreviar(formatarCompetencia(d.competencia),normal,7,195),margem+6,y-22,7,normal,COR.cinza);
  escrever(dataBrasileira(d.vencimento),margem+213,y-16,7.5);
  direita(moeda(d.valor_principal),margem+350,y-16,7.2);
  direita(calc.juros===null?'Pendente':moeda((calc.juros??0)+(calc.multa??0)),margem+440,y-16,7.2);
  direita(calc.total===null?'Pendente':moeda(calc.total),margem+largura-6,y-16,7.2,forte);
  pagina.drawLine({start:{x:margem,y:y-alturaLinha},end:{x:W-margem,y:y-alturaLinha},thickness:.4,color:COR.borda});y-=alturaLinha;
 }
 garantia(93);y-=22;escrever('Resumo e critérios',margem,y,11,forte);y-=23;
 escrever(`Principal em aberto: ${moeda(resumo.totalPrincipal)}`,margem,y,9);y-=17;
 escrever(resumo.totalAtualizado===null?'Total atualizado indisponível - Selic pendente':`Total estimado atualizado: ${moeda(resumo.totalAtualizado)}`,margem,y,9,forte);y-=17;
 escrever(`${resumo.quantidadeVencidos} vencidos | ${resumo.quantidadeVencer} a vencer | ${resumo.incompletos} sem índices`,margem,y,8,normal,COR.cinza);y-=22;
 const avisos=['Multa federal estimada: 0,33% ao dia de mora, limitada a 20%.','Juros federais: Selic mensal após vencimento + 1% no mês da consulta.','Tributos estaduais, municipais e parcelamentos exigem regras próprias.','Valores gerenciais: prevalece a guia emitida pelo ente arrecadador.'];
 for(const aviso of avisos){garantia(18);escrever(abreviar(aviso,normal,7.4,largura),margem,y,7.4,normal,COR.cinza);y-=15;}
 const paginas=documento.getPages();paginas.forEach((folha,i)=>{folha.drawLine({start:{x:margem,y:43},end:{x:W-margem,y:43},thickness:.6,color:COR.borda});folha.drawText('On Contabilidade',{x:margem,y:28,font:normal,size:8,color:COR.cinza});const n=`Página ${i+1} de ${paginas.length}`;folha.drawText(n,{x:W-margem-normal.widthOfTextAtSize(n,8),y:28,font:normal,size:8,color:COR.cinza});});
 return documento.save();
}
