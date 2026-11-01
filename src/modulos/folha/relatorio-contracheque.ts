import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { MemoriaContracheque } from './calculos';
import { formatarDocumento } from '@/lib/utilitarios/formatacao';

/** Reproduz somente o FORMATO do PDF de referência: A4 retrato, duas vias,
 * quadro de identificação, eventos, totais, bases e assinatura lateral.
 * Valores são derivados da memória validada, nunca do arquivo-modelo.
 */
export async function gerarPdfContracheque(memoria:MemoriaContracheque):Promise<Uint8Array>{
 const documento=await PDFDocument.create();
 documento.setTitle(`Contracheque ${memoria.funcionario.nome} ${memoria.competencia}`);
 documento.setAuthor('On Contabilidade');
 const pagina=documento.addPage([595.28,841.89]);
 const regular=await documento.embedFont(StandardFonts.Helvetica);
 const negrito=await documento.embedFont(StandardFonts.HelveticaBold);
 const preto=rgb(0,0,0);
 const linha=0.7;
 const dinheiro=(numero:number)=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(numero);
 const [ano,mes]=memoria.competencia.split('-');
 const mesPorExtenso=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][Number(mes)-1];
 const rotuloMes=`${mesPorExtenso.charAt(0).toUpperCase()+mesPorExtenso.slice(1)} ${ano}`;
 const desenharTexto=(texto:string,x:number,y:number,tamanho=7,fonte:PDFFont=regular,largura?:number,alinhamento:'direita'|'centro'|'esquerda'='esquerda')=>{
  const seguro=(texto||'').replace(/[\u2013\u2014]/g,'-').replace(/[\u2192]/g,'>').replace(/[^\x20-\x7E\u00A0-\u00FF]/g,'');
  const medido=fonte.widthOfTextAtSize(seguro,tamanho);
  const inicio=largura&&alinhamento==='direita'?x+largura-medido-2:largura&&alinhamento==='centro'?x+(largura-medido)/2:x;
  pagina.drawText(seguro,{x:inicio,y,size:tamanho,font:fonte,color:preto});
 };
 const retangulo=(x:number,y:number,largura:number,altura:number)=>pagina.drawRectangle({x,y,width:largura,height:altura,borderWidth:linha,borderColor:preto});
 const horizontal=(x1:number,y:number,x2:number)=>pagina.drawLine({start:{x:x1,y},end:{x:x2,y},thickness:linha,color:preto});
 const vertical=(x:number,y1:number,y2:number)=>pagina.drawLine({start:{x,y:y1},end:{x,y:y2},thickness:linha,color:preto});
 const x=29, largura=502, lateralX=539, lateralLargura=35;
 const coluna=[x,x+48,x+278,x+329,x+420,x+largura];
 const bloco=(topo:number,empregador:boolean)=>{
   const cabecalhoBase=topo-46;
   retangulo(x,cabecalhoBase,largura,46);
   desenharTexto(empregador?'EMPRESA':'EMPREGADOR',x+7,topo-13,6,negrito);
   desenharTexto(memoria.empresa.nome.slice(0,43),x+54,topo-13,7.7,negrito);
   desenharTexto('ENDEREÇO',x+7,topo-22,6,negrito);
   const endereco=(memoria.empresa.endereco||memoria.empresa.cidade||'Endereço não cadastrado').trim();
   // Usa até duas linhas compactas, preservando o quadro do contracheque.
   const larguraEndereco=215, tamanhoEndereco=5.55;
   const partes=endereco.split(/\s+/);const linhasEndereco:string[]=[''];
   for(const parte of partes){
     const atual=linhasEndereco.length-1;
     const tentativa=(linhasEndereco[atual]+' '+parte).trim();
     if(negrito.widthOfTextAtSize(tentativa,tamanhoEndereco)>larguraEndereco&&linhasEndereco[atual])linhasEndereco.push(parte);
     else linhasEndereco[atual]=tentativa;
   }
   const textoEndereco=linhasEndereco.length>2 ? [linhasEndereco[0],linhasEndereco.slice(1).join(' ')] : linhasEndereco;
   textoEndereco.slice(0,2).forEach((texto,i)=>{
     let exibido=texto;
     let restantes=texto.length;
     while(restantes>0&&negrito.widthOfTextAtSize(exibido,tamanhoEndereco)>larguraEndereco){
       restantes-=1;exibido=texto.slice(0,restantes).trimEnd()+'...';
     }
     desenharTexto(exibido,x+54,topo-21-i*8,tamanhoEndereco,negrito);
   });
   desenharTexto('CNPJ',x+7,topo-40,6,negrito);
   desenharTexto(formatarDocumento(memoria.empresa.cnpj,'PJ'),x+54,topo-40,6.8,negrito);
   desenharTexto(empregador?'Recibo de Pagamento de Salário':'Demonstrativo de Pagamento de Salário',x+274,topo-13,10.5,negrito,largura-277,'direita');
   desenharTexto('Referente ao Mês / Ano',x+340,topo-27,6,regular,largura-343,'direita');
   desenharTexto(rotuloMes,x+340,topo-41,8,negrito,largura-343,'direita');
   const idTopo=topo-51,idBase=idTopo-25;
   retangulo(x,idBase,largura,25);
   desenharTexto('CÓDIGO',x+7,idTopo-9,6);desenharTexto('NOME DO FUNCIONÁRIO',x+47,idTopo-9,6);
   desenharTexto('CBO',x+280,idTopo-9,6);desenharTexto('FUNÇÃO',x+337,idTopo-9,6);
   desenharTexto(memoria.funcionario.codigo,x+7,idTopo-20,8,negrito);
   desenharTexto(memoria.funcionario.nome.slice(0,44),x+47,idTopo-20,8,negrito);
   desenharTexto(memoria.funcionario.cbo,x+280,idTopo-20,8,negrito);
   desenharTexto(memoria.funcionario.cargo.slice(0,29),x+337,idTopo-20,8,negrito);
   const eventosTopo=topo-81,eventosBase=topo-271;
   retangulo(x,eventosBase,largura,eventosTopo-eventosBase);
   horizontal(x,eventosTopo-14,x+largura);
   for(const separador of coluna.slice(1,-1))vertical(separador,eventosBase,eventosTopo);
   const cabecalhos=['Código','Descrição','Referência','Proventos','Descontos'];
   for(let i=0;i<cabecalhos.length;i++)desenharTexto(cabecalhos[i],coluna[i]+3,eventosTopo-10,7,regular,coluna[i+1]-coluna[i]-6,'centro');
   const eventos=memoria.eventos;
   if(eventos.length>17)throw new Error('O modelo PDF de duas vias suporta no máximo 17 linhas de eventos.');
   eventos.forEach((evento,i)=>{
     const posY=eventosTopo-25-i*10;
     desenharTexto(evento.codigo,coluna[0]+6,posY,7.5);
     const descricao=evento.descricao.toLocaleUpperCase('pt-BR').slice(0,43);
     desenharTexto(descricao,coluna[1]+3,posY,7.2);
     // Exibe apenas a medida de cálculo (ex.: 9h, 1d ou 9,00%),
     // sem notas complementares como o adicional (100%).
     const referenciaVisivel=evento.referencia.replace(/\s*\([^)]*\)/g,'').trim();
     desenharTexto(referenciaVisivel.slice(0,14),coluna[2]+1,posY,7.2,regular,coluna[3]-coluna[2]-3,'centro');
     if(evento.tipo==='PROVENTO')desenharTexto(dinheiro(evento.valor),coluna[3]+1,posY,7.5,regular,coluna[4]-coluna[3]-3,'direita');
     if(evento.tipo==='DESCONTO')desenharTexto(dinheiro(evento.valor),coluna[4]+1,posY,7.5,regular,coluna[5]-coluna[4]-3,'direita');
   });
   desenharTexto('MENSAGENS',x+1,eventosBase-7,6);
   // Quadro de totais: três faixas independentes para evitar sobreposição.
   // A primeira contém os títulos (15 pt), a segunda os valores (20 pt)
   // e a última o líquido a receber (17 pt), mantendo as duas vias em A4.
   const totaisBase=topo-323;
   const separadorTitulos=eventosBase-15;
   const separadorLiquido=eventosBase-35;
   retangulo(x,totaisBase,largura,eventosBase-totaisBase);
   vertical(coluna[3],totaisBase,eventosBase);
   // A divisão entre vencimentos e descontos termina antes da faixa do líquido.
   vertical(coluna[4],separadorLiquido,eventosBase);
   horizontal(coluna[3],separadorTitulos,x+largura);
   horizontal(coluna[3],separadorLiquido,x+largura);
   desenharTexto('Total dos Vencimentos',coluna[3]+2,eventosBase-10,5.3,regular,coluna[4]-coluna[3]-4,'centro');
   desenharTexto('Total dos Descontos',coluna[4]+1,eventosBase-10,5.3,regular,coluna[5]-coluna[4]-3,'centro');
   desenharTexto(dinheiro(memoria.total_proventos),coluna[3]+1,eventosBase-28,8.4,regular,coluna[4]-coluna[3]-3,'direita');
   desenharTexto(dinheiro(memoria.total_descontos),coluna[4]+1,eventosBase-28,8.4,regular,coluna[5]-coluna[4]-3,'direita');
   desenharTexto('Líquido a Receber',coluna[3]+4,totaisBase+5,7,negrito,105,'esquerda');
   desenharTexto(dinheiro(memoria.liquido),coluna[4]+1,totaisBase+5,9,negrito,coluna[5]-coluna[4]-3,'direita');
   const base=topo-342;
   retangulo(x,base,largura,19);
   const medidas=[
     ['Salário Base',memoria.funcionario.salario_base],['Base Cálc. INSS',memoria.base_inss],
     ['Base Cálc. FGTS',memoria.base_fgts],['FGTS do Mês',memoria.deposito_fgts],
     ['Base Cálc. IRRF',memoria.base_irrf],['Faixa IRRF',memoria.aliquota_irrf]
   ];
   const larguraMedida=largura/medidas.length;
   medidas.forEach((medida,i)=>{
     const inicio=x+i*larguraMedida;
     desenharTexto(medida[0] as string,inicio+1,base+12,5.5,regular,larguraMedida-2,'centro');
     desenharTexto(i===5?`${dinheiro(Number(medida[1]))}%`:dinheiro(Number(medida[1])),inicio+1,base+3,7.5,regular,larguraMedida-2,'centro');
   });
   retangulo(lateralX,base,lateralLargura,topo-base);
   // Lateral de assinatura com a mesma organização da referência: declaração, assinatura e data.
   pagina.drawText('DECLARO TER RECEBIDO A IMPORTÂNCIA LÍQUIDA DISCRIMINADA NESTE RECIBO.',{x:lateralX+8,y:base+5,size:5.5,font:regular,color:preto,rotate:degrees(90)});
   vertical(lateralX+25,base+125,topo-34);
   pagina.drawText('ASSINATURA DO FUNCIONÁRIO',{x:lateralX+30,y:base+136,size:6,font:regular,color:preto,rotate:degrees(90)});
   vertical(lateralX+25,base+18,base+105);
   pagina.drawText('DATA  /  /',{x:lateralX+31,y:base+24,size:6,font:regular,color:preto,rotate:degrees(90)});
   desenharTexto(empregador?'1ª VIA - EMPREGADOR':'2ª VIA - EMPREGADO',x,base-10,6,regular);
 };
 bloco(790,true);
 bloco(412,false);
 return documento.save();
}
