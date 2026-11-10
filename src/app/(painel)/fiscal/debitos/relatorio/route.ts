import {NextRequest,NextResponse} from 'next/server';
import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {consultarDebitosFiscais} from '@/modulos/fiscal/debitos/consultas';
import {gerarRelatorioDebitosPdf} from '@/modulos/fiscal/debitos/relatorio-pdf';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(requisicao:NextRequest){
 await exigirEscritorio();
 const id=requisicao.nextUrl.searchParams.get('cliente');
 if(!id||!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))return NextResponse.json({erro:'Selecione um cliente para emitir o relatório.'},{status:400});
 const {clientes,debitos,taxas}=await consultarDebitosFiscais(id);
 const cliente=clientes.find(c=>c.id===id);
 if(!cliente)return NextResponse.json({erro:'Cliente não localizado no escritório.'},{status:404});
 const hoje=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const pdf=await gerarRelatorioDebitosPdf(cliente,debitos,taxas,hoje);
 const nomeCliente=cliente.razao_social.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/:*?"<>|\r\n]/g,' ').replace(/\s+/g,' ').trim().toLocaleUpperCase('pt-BR').slice(0,100);
 const competencia=`${hoje.slice(5,7)}${hoje.slice(0,4)}`;
 const nome=`RELATÓRIO DE DÉBITOS ${competencia} - ${nomeCliente}.pdf`;
 const nomeAscii=nome.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 return new NextResponse(Buffer.from(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${nomeAscii}"; filename*=UTF-8''${encodeURIComponent(nome)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
