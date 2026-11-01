import { NextRequest,NextResponse } from 'next/server';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { mesValido } from '@/lib/utilitarios/formatacao';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import { totalizarReceitas,limiteEfetivoMei } from '@/modulos/fiscal/calculos';

type RegistroFiscal={cliente_id:string;competencia:string;data_movimento:string;tipo_movimento:string;atividade_receita:string|null;descricao:string|null;numero_documento:string|null;valor:number};
type ClienteRelatorio={id:string;razao_social:string;cpf_cnpj:string;regime_tributario:string|null;data_abertura:string|null};
const csvValor=(valor:unknown)=>{const texto=String(valor??'');const protegido=/^[\s]*[=+@\-\t\r]/.test(texto)?`'${texto}`:texto;return `"${protegido.replaceAll('"','""')}"`;};
const numeroBr=(valor:number)=>Number(valor).toFixed(2).replace('.',',');
const linhasCsv=(linhas:(string|number|null|undefined)[][])=>'\uFEFF'+linhas.map(linha=>linha.map(csvValor).join(';')).join('\r\n');
const arquivoCsv=(linhas:(string|number|null|undefined)[][],nome:string)=>new NextResponse(linhasCsv(linhas),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${nome}.csv"`,'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});

export async function GET(requisicao:NextRequest){
  const {banco,escritorioId}=await exigirEscritorio();
  const parametros=requisicao.nextUrl.searchParams;
  const competenciaInformada=parametros.get('competencia');
  if(competenciaInformada&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(competenciaInformada))return new NextResponse('Competência inválida.',{status:400});
  const mes=mesValido(competenciaInformada);const ano=Number(mes.slice(0,4));
  const tipo=parametros.get('tipo')??'todos';
  if(!['todos','mei','convencional'].includes(tipo))return new NextResponse('Tipo de relatório inválido.',{status:400});
  const [clientes,movimentos]=await Promise.all([
    consultarTodasPaginas<ClienteRelatorio>((inicio,fim)=>banco.from('clientes').select('id,razao_social,cpf_cnpj,regime_tributario,data_abertura').eq('escritorio_id',escritorioId).order('id').range(inicio,fim)),
    consultarTodasPaginas<RegistroFiscal>((inicio,fim)=>banco.from('movimentacoes_fiscais').select('cliente_id,competencia,data_movimento,tipo_movimento,atividade_receita,descricao,numero_documento,valor').eq('escritorio_id',escritorioId)
      .gte('competencia',tipo==='mei'?`${ano}-01-01`:`${mes}-01`).lte('competencia',tipo==='mei'?`${ano}-12-01`:`${mes}-01`).order('id').range(inicio,fim)),
  ]);
  const nomes=Object.fromEntries(clientes.map(item=>[item.id,item]));
  if(tipo==='mei'){
    const clienteId=parametros.get('cliente');
    const cliente=clientes.find(item=>item.id===clienteId&&item.regime_tributario==='MEI');
    if(!cliente)return new NextResponse('Cliente MEI inexistente ou sem permissão.',{status:404});
    const [ajustes,{data:regra,error:erroRegra}]=await Promise.all([
      consultarTodasPaginas<{competencia:string;valor:number;justificativa:string}>((inicio,fim)=>banco.from('ajustes_faturamento_mei').select('competencia,valor,justificativa').eq('escritorio_id',escritorioId).eq('cliente_id',cliente.id).gte('competencia',`${ano}-01-01`).lte('competencia',`${ano}-12-01`).order('id').range(inicio,fim)),
      banco.from('regras_limites_mei').select('ano_calendario,limite_anual,percentual_alerta,proporcional_ano_abertura').eq('escritorio_id',escritorioId).eq('ano_calendario',ano).not('aprovado_em','is',null).maybeSingle(),
    ]);
    if(erroRegra)return new NextResponse('Não foi possível obter a regra MEI.',{status:500});
    const receitas=movimentos.filter(item=>item.cliente_id===cliente.id&&item.tipo_movimento==='RECEITA').map(item=>({...item,valor:Number(item.valor)}));
    const ajustesNumericos=ajustes.map(item=>({...item,valor:Number(item.valor)}));
    const totais=totalizarReceitas(receitas,ajustesNumericos);
    const limite=regra?limiteEfetivoMei({ano_calendario:ano,limite_anual:Number(regra.limite_anual),percentual_alerta:Number(regra.percentual_alerta),proporcional_ano_abertura:regra.proporcional_ano_abertura},cliente.data_abertura):null;
    const linhas:(string|number|null|undefined)[][]=[
      ['ON ERP — RELATÓRIO GERENCIAL DE FATURAMENTO MEI'],['Cliente',cliente.razao_social],['CPF/CNPJ',cliente.cpf_cnpj],['Ano-calendário',ano],
      ['Limite anual parametrizado (R$)',limite===null?'Não configurado':numeroBr(limite)],['Total anual com ajustes (R$)',numeroBr(totais.total)],[],
      ['Mês','Comércio/indústria (R$)','Serviços (R$)','Outras receitas (R$)','Ajustes (R$)','Total do mês (R$)'],
    ];
    for(let indice=1;indice<=12;indice++){
      const competencia=`${ano}-${String(indice).padStart(2,'0')}-01`;
      const registros=receitas.filter(item=>item.competencia===competencia);
      const ajustesMes=ajustesNumericos.filter(item=>item.competencia===competencia);
      const resumo=totalizarReceitas(registros,ajustesMes);
      const ajustesTotal=ajustesMes.reduce((soma,item)=>soma+item.valor,0);
      linhas.push([`${String(indice).padStart(2,'0')}/${ano}`,numeroBr(resumo.comercio),numeroBr(resumo.servicos),numeroBr(resumo.total-resumo.comercio-resumo.servicos-ajustesTotal),numeroBr(ajustesTotal),numeroBr(resumo.total)]);
    }
    linhas.push(['TOTAL',numeroBr(totais.comercio),numeroBr(totais.servicos),numeroBr(totais.total-totais.comercio-totais.servicos-ajustesNumericos.reduce((soma,item)=>soma+item.valor,0)),numeroBr(ajustesNumericos.reduce((soma,item)=>soma+item.valor,0)),numeroBr(totais.total)],[],
      ['DETALHAMENTO DAS RECEITAS'],['Data','Competência','Atividade','Documento','Descrição','Valor (R$)']);
    for(const item of receitas)linhas.push([item.data_movimento,item.competencia,item.atividade_receita??'',item.numero_documento??'',item.descricao??'',numeroBr(item.valor)]);
    linhas.push([],['AJUSTES JUSTIFICADOS'],['Competência','Justificativa','Valor (R$)']);
    for(const ajuste of ajustesNumericos)linhas.push([ajuste.competencia,ajuste.justificativa,numeroBr(ajuste.valor)]);
    linhas.push([],['Relatório de controle interno. Não substitui declaração ou documento fiscal oficial.']);
    return arquivoCsv(linhas,`faturamento-mei-${ano}-${cliente.id}`);
  }
  const registros=movimentos.filter(item=>tipo==='convencional'?nomes[item.cliente_id]?.regime_tributario!=='MEI':Boolean(nomes[item.cliente_id]));
  const somar=(tipoMovimento:string)=>registros.filter(item=>item.tipo_movimento===tipoMovimento).reduce((soma,item)=>soma+Number(item.valor),0);
  const linhas:(string|number|null|undefined)[][]=[
    [`ON ERP — RELATÓRIO GERENCIAL DE FATURAMENTO ${tipo==='convencional'?'CONVENCIONAL':'GERAL'}`],
    ['Competência',mes],['Receitas (R$)',numeroBr(somar('RECEITA'))],['Entradas (R$)',numeroBr(somar('ENTRADA'))],['Despesas (R$)',numeroBr(somar('DESPESA'))],[],
    ['Cliente','CPF/CNPJ','Regime','Competência','Data','Tipo','Atividade','Descrição','Documento','Valor (R$)'],
    ...registros.map(item=>[nomes[item.cliente_id]?.razao_social??'',nomes[item.cliente_id]?.cpf_cnpj??'',nomes[item.cliente_id]?.regime_tributario??'',item.competencia,item.data_movimento,item.tipo_movimento,item.atividade_receita??'',item.descricao??'',item.numero_documento??'',numeroBr(Number(item.valor))]),
    [],['Entradas e despesas não compõem o faturamento; relatório não equivale a apuração tributária.'],
  ];
  return arquivoCsv(linhas,`faturamento-${tipo}-${mes}`);
}
