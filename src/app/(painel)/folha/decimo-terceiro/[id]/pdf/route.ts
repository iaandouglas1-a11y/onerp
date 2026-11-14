import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {gerarPdfContracheque} from '@/modulos/folha/relatorio-contracheque';
import type {Memoria13} from '@/modulos/folha/decimo-terceiro';
export const runtime='nodejs';
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return new Response('ID inválido.',{status:400});
 const {banco,escritorioId}=await exigirEscritorio();
 const {data,error}=await banco.from('contracheques_decimo_terceiro').select('id,situacao,memoria_calculo').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
 if(error)return new Response('Erro ao consultar recibo.',{status:500});
 if(!data)return new Response('Recibo não localizado.',{status:404});
 const m=data.memoria_calculo as Memoria13;
 if(m?.versao!=='1'||!['ADIANTAMENTO_13','SEGUNDA_PARCELA_13'].includes(m?.tipo_13))return new Response('Memória inválida.',{status:422});
 const pdf=await gerarPdfContracheque(m);
 return new Response(Uint8Array.from(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="13o_${m.ano_13}_${id.slice(0,8)}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
