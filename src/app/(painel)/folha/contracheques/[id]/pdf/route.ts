import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { gerarPdfContracheque } from '@/modulos/folha/relatorio-contracheque';
import type { MemoriaContracheque } from '@/modulos/folha/calculos';
export const runtime='nodejs';
export async function GET(_requisicao:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new Response('Identificador inválido.',{status:400});
 const {banco,escritorioId}=await exigirEscritorio();
 const {data,error:erro}=await banco.from('contracheques_folha').select('id,memoria_calculo').eq('escritorio_id',escritorioId).eq('id',id).maybeSingle();
 if(erro)return new Response('Não foi possível consultar o contracheque.',{status:500});
 if(!data)return new Response('Contracheque não localizado.',{status:404});
 const memoria=data.memoria_calculo as MemoriaContracheque;
 if(memoria?.versao!=='1')return new Response('Versão do contracheque desconhecida.',{status:422});
 const pdf=await gerarPdfContracheque(memoria);
 const nomeArquivo=`contracheque_${memoria.competencia}_${id.slice(0,8)}.pdf`;
 return new Response(Uint8Array.from(pdf),{headers:{'Content-Type':'application/pdf',
 'Content-Disposition':`inline; filename="${nomeArquivo}"`,
 'Cache-Control':'private, no-store, max-age=0',
 'X-Content-Type-Options':'nosniff'}});
}
