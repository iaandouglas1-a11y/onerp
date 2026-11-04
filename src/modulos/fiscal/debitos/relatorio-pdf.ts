import 'server-only';
import {PDFDocument,StandardFonts,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {moeda,dataBrasileira,formatarDocumento} from '@/lib/utilitarios/formatacao';
import {calcularDebito,consolidarDebitos,type DebitoFiscal,type TaxaSelic} from './calculos';

const azul=rgb(0.039,0.067,0.110),verde=rgb(0.486,0.725,0.235),vermelho=rgb(0.74,0.26,0.23),cinza=rgb(0.60,0.65,0.71),claro=rgb(0.96,0.97,0.98),branco=rgb(1,1,1);
const seguro=(v:unknown)=>String(v??'').replace(/[\u2010-\u2015]/g,'-').replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/\s+/g,' ').trim();
function caber(texto:string,fonte:PDFFont,tamanho:number,max:number){let valor=seguro(texto);while(valor.length>2&&fonte.widthOfTextAtSize(valor,tamanho)>max)valor=valor.slice(0,-4)+'...';return valor;}
export async function gerarRelatorioDebitosPdf(cliente:{razao_social:string;cpf_cnpj:string},debitos:DebitoFiscal[],taxas:TaxaSelic[],hoje:string){
 const documento=await PDFDocument.create();documento.setTitle(`Relatório de débitos - ${cliente.razao_social}`);documento.setAuthor('On Contabilidade');
 const normal=await documento.embedFont(StandardFonts.Helvetica);const forte=await documento.embedFont(StandardFonts.HelveticaBold);
 const logo=await documento.embedPng(await readFile(join(process.cwd(),'public','marca','on-contabilidade-escura.png')));
 const ativos=debitos.filter(d=>d.situacao==='ABERTO');const resumo=consolidarDebitos(ativos,taxas,hoje);
 const W=595.28,H=841.89, margem=38;let pagina:PDFPage;let y=0;
 function texto(valor:unknown,x:number,y0:number,tamanho=9,fonte:PDFFont=normal,cor=azul){pagina.drawText(seguro(valor),{x,y:y0,size:tamanho,font:fonte,color:cor});}
 function paginaNova(){pagina=documento.addPage([W,H]);pagina.drawRectangle({x:0,y:H-7,width:W,height:7,color:verde});pagina.drawImage(logo,{x:margem,y:H-76,width:69,height:56.5});texto('RELATÓRIO FISCAL',W-margem-92,H-43,8,forte,cinza);pagina.drawLine({start:{x:margem,y:H-87},end:{x:W-margem,y:H-87},color:rgb(.85,.88,.90),thickness:.8});y=H-110;}
 function box(x:number,rotulo:string,valor:number,cor:ReturnType<typeof rgb>){pagina.drawRectangle({x,y:y-73,width:166,height:65,color:claro});pagina.drawRectangle({x,y:y-73,width:166,height:4,color:cor});texto(rotulo,x+10,y-23,8,normal,cinza);texto(moeda(valor),x+10,y-49,13,forte,cor);}
 function cabecalhoTabela(){pagina.drawRectangle({x:margem,y:y-25,width:W-2*margem,height:25,color:claro});texto('DÉBITO / REFERÊNCIA',margem+6,y-17,7.6,forte);texto('VENC.',margem+224,y-17,7.6,forte);texto('PRINCIPAL',margem+286,y-17,7.6,forte);texto('ACRÉSC.',margem+369,y-17,7.6,forte);texto('TOTAL',margem+452,y-17,7.6,forte);y-=26;}
 paginaNova();texto('Relatório de débitos fiscais',margem,y,17,forte);y-=24;
 texto(`Cliente: ${caber(cliente.razao_social,normal,9,390)}`,margem,y,9);y-=16;
 texto(`CPF/CNPJ: ${formatarDocumento(cliente.cpf_cnpj)}`,margem,y,9);y-=16;
 texto(`Atualizado em: ${dataBrasileira(hoje)} | Valores para conferência`,margem,y,8,normal,cinza);y-=26;
 box(margem,'TOTAL EM ABERTO',resumo.totalPrincipal,azul);box(margem+176,'VENCIDOS',resumo.vencidoPrincipal,vermelho);box(margem+352,'A VENCER',resumo.vencerPrincipal,verde);y-=98;
 texto('Débitos em aberto',margem,y,11,forte);y-=20;cabecalhoTabela();
 if(!ativos.length){texto('Nenhum débito em aberto.',margem+6,y-17,9);y-=35;}
 for(let i=0;i<ativos.length;i++){
  const d=ativos[i];const calc=calcularDebito(d,taxas,hoje);
  if(y-50<80){paginaNova();texto('Débitos em aberto (continuação)',margem,y,11,forte);y-=20;cabecalhoTabela();}
  if(i%2===1)pagina.drawRectangle({x:margem,y:y-43,width:W-2*margem,height:43,color:rgb(.987,.99,.991)});
  texto(caber(`${d.tipo_debito.replaceAll('_',' ')} - ${d.descricao}`,forte,7.6,213),margem+6,y-15,7.6,forte);
  texto(caber(d.numero_referencia??'',normal,7,213),margem+6,y-29,7,normal,cinza);
  texto(dataBrasileira(d.vencimento),margem+224,y-18,7.5);
  texto(moeda(d.valor_principal),margem+280,y-18,7.5);
  texto(calc.juros===null?'Pendente':moeda((calc.juros??0)+(calc.multa??0)),margem+367,y-18,7.1);
  texto(calc.total===null?'Pendente':moeda(calc.total),margem+449,y-18,7.1,forte);
  pagina.drawLine({start:{x:margem,y:y-43},end:{x:W-margem,y:y-43},thickness:.4,color:rgb(.86,.88,.91)});y-=43;
 }
 if(y<170){paginaNova();}
 y-=24;texto('Resumo e critérios',margem,y,11,forte);y-=22;
 texto(`Total principal em aberto: ${moeda(resumo.totalPrincipal)}`,margem,y,9);y-=17;
 texto(resumo.totalAtualizado===null?'Total atualizado: INDISPONÍVEL - índices Selic pendentes':`Total estimado com acréscimos: ${moeda(resumo.totalAtualizado)}`,margem,y,9,forte);y-=17;
 texto(`${resumo.quantidadeVencidos} vencidos | ${resumo.quantidadeVencer} a vencer | ${resumo.incompletos} com índices faltantes`,margem,y,8,normal,cinza);y-=18;
 const avisos=['Valores gerenciais para conferência; a guia oficial do ente arrecadador prevalece.',
 'Multa e juros federais usam parâmetros legais e índices Selic cadastrados.','Para débitos estaduais, municipais ou parcelados, confirme acréscimos com o órgão competente.',
 'Os totais dos boxes correspondem ao principal em aberto; débitos quitados e cancelados não entram.'];
 for(const aviso of avisos){if(y<65){paginaNova();}texto(caber(aviso,normal,7.2,W-2*margem),margem,y,7.2,normal,cinza);y-=14;}
 const paginas=documento.getPages();paginas.forEach((folha,i)=>{folha.drawLine({start:{x:margem,y:42},end:{x:W-margem,y:42},thickness:.6,color:rgb(.85,.88,.90)});folha.drawText('On Contabilidade',{x:margem,y:27,font:normal,size:7,color:cinza});const n=`Página ${i+1} de ${paginas.length}`;folha.drawText(n,{x:W-margem-normal.widthOfTextAtSize(n,7),y:27,font:normal,size:7,color:cinza});});
 return documento.save();
}
