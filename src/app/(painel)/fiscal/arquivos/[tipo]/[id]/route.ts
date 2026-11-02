import { NextResponse } from 'next/server';
import { obterArquivoFiscal } from '@/modulos/fiscal/operacoes-documentais';
export const dynamic='force-dynamic';
export async function GET(_pedido:Request,{params}:{params:Promise<{tipo:string;id:string}>}){
  const {tipo,id}=await params;
  if(!['xml','das','dasn'].includes(tipo))return new Response('Tipo de arquivo inválido.',{status:404});
  try{
    const url=await obterArquivoFiscal(tipo as 'xml'|'das'|'dasn',id);
    return NextResponse.redirect(url,{status:303,headers:{'Cache-Control':'private, no-store'}});
  }catch{return new Response('Arquivo não encontrado ou acesso não autorizado.',{status:404,headers:{'Cache-Control':'private, no-store'}});}
}
