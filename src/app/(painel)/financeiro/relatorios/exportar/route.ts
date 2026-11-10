import {NextRequest,NextResponse} from 'next/server';
import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {carregarFinanceiro} from '@/modulos/financeiro/consultas';
import {gerarPdfFinanceiro} from '@/modulos/financeiro/relatorios/gerador-financeiro';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(requisicao:NextRequest){
 const ano=Number(requisicao.nextUrl.searchParams.get('ano'));
 if(!Number.isInteger(ano)||ano<2020||ano>2200)return new NextResponse('Ano inválido.',{status:400});
 const {banco,escritorioId}=await exigirEscritorio();
 const {data:escritorio,error}=await banco.from('escritorios').select('nome').eq('id',escritorioId).single();
 if(error||!escritorio)return new NextResponse('Escritório não encontrado.',{status:404});
 const dados=await carregarFinanceiro();
 const bytes=await gerarPdfFinanceiro(dados,ano,escritorio.nome||'On Contabilidade');
 return new NextResponse(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="relatorio-financeiro-${ano}.pdf"`,'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
}
