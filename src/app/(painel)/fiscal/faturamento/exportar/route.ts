import { NextRequest, NextResponse } from 'next/server';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { mesValido } from '@/lib/utilitarios/formatacao';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import { totalizarReceitas, limiteEfetivoMei } from '@/modulos/fiscal/calculos';
import { gerarRelatorioPdf, type TabelaRelatorio } from '@/modulos/fiscal/relatorios/gerador-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RegistroFiscal = { cliente_id: string; competencia: string; data_movimento: string; tipo_movimento: string; atividade_receita: string | null; descricao: string | null; numero_documento: string | null; valor: number };
type ClienteRelatorio = { id: string; razao_social: string; cpf_cnpj: string; regime_tributario: string | null; data_abertura: string | null };
const moeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
const dataBr = (valor: string) => /^\d{4}-\d{2}-\d{2}/.test(valor) ? `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}` : valor;
const nomeMes = (mes: string) => `${mes.slice(5, 7)}/${mes.slice(0, 4)}`;

async function responderPdf(conteudo: Parameters<typeof gerarRelatorioPdf>[0], nomeArquivo: string) {
  const bytes = await gerarRelatorioPdf(conteudo);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeArquivo}.pdf"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function GET(requisicao: NextRequest) {
  const { banco, escritorioId } = await exigirEscritorio();
  const parametros = requisicao.nextUrl.searchParams;
  const competenciaInformada = parametros.get('competencia');
  if (competenciaInformada && !/^\d{4}-(0[1-9]|1[0-2])$/.test(competenciaInformada)) return new NextResponse('Competência inválida.', { status: 400 });
  const mes = mesValido(competenciaInformada);
  const ano = Number(mes.slice(0, 4));
  const tipo = parametros.get('tipo') ?? 'todos';
  if (!['todos', 'mei', 'convencional'].includes(tipo)) return new NextResponse('Tipo de relatório inválido.', { status: 400 });
  const [clientes, movimentos] = await Promise.all([
    consultarTodasPaginas<ClienteRelatorio>((inicio, fim) => banco.from('clientes').select('id,razao_social,cpf_cnpj,regime_tributario,data_abertura').eq('escritorio_id', escritorioId).order('id').range(inicio, fim)),
    consultarTodasPaginas<RegistroFiscal>((inicio, fim) => banco.from('movimentacoes_fiscais')
      .select('cliente_id,competencia,data_movimento,tipo_movimento,atividade_receita,descricao,numero_documento,valor').eq('escritorio_id', escritorioId)
      .gte('competencia', tipo === 'mei' ? `${ano}-01-01` : `${mes}-01`)
      .lte('competencia', tipo === 'mei' ? `${ano}-12-01` : `${mes}-01`)
      .order('id').range(inicio, fim)),
  ]);
  const porId = Object.fromEntries(clientes.map(cliente => [cliente.id, cliente]));

  if (tipo === 'mei') {
    const clienteId = parametros.get('cliente');
    const cliente = clientes.find(item => item.id === clienteId && item.regime_tributario === 'MEI');
    if (!cliente) return new NextResponse('Cliente MEI inexistente ou sem permissão.', { status: 404 });
    const [ajustes, { data: regra, error: erroRegra }] = await Promise.all([
      consultarTodasPaginas<{ competencia: string; valor: number; justificativa: string }>((inicio, fim) => banco.from('ajustes_faturamento_mei')
        .select('competencia,valor,justificativa').eq('escritorio_id', escritorioId).eq('cliente_id', cliente.id)
        .gte('competencia', `${ano}-01-01`).lte('competencia', `${ano}-12-01`).order('id').range(inicio, fim)),
      banco.from('regras_limites_mei').select('ano_calendario,limite_anual,percentual_alerta,proporcional_ano_abertura')
        .eq('escritorio_id', escritorioId).eq('ano_calendario', ano).not('aprovado_em', 'is', null).maybeSingle(),
    ]);
    if (erroRegra) return new NextResponse('Não foi possível obter a regra MEI.', { status: 500 });
    const receitas = movimentos.filter(item => item.cliente_id === cliente.id && item.tipo_movimento === 'RECEITA').map(item => ({ ...item, valor: Number(item.valor) }));
    const ajustesNumericos = ajustes.map(item => ({ ...item, valor: Number(item.valor) }));
    const totais = totalizarReceitas(receitas, ajustesNumericos);
    const limite = regra ? limiteEfetivoMei({ ano_calendario: ano, limite_anual: Number(regra.limite_anual), percentual_alerta: Number(regra.percentual_alerta), proporcional_ano_abertura: regra.proporcional_ano_abertura }, cliente.data_abertura) : null;
    const somatorioAjustes = ajustesNumericos.reduce((soma, ajuste) => soma + ajuste.valor, 0);
    const tabelas: TabelaRelatorio[] = [{
      titulo: 'Faturamento mensal por atividade',
      colunas: [ { titulo: 'Mês', largura: 1 }, { titulo: 'Comércio / indústria', largura: 1.7, alinhamento: 'direita' }, { titulo: 'Serviços', largura: 1.7, alinhamento: 'direita' }, { titulo: 'Outras', largura: 1.5, alinhamento: 'direita' }, { titulo: 'Ajustes', largura: 1.2, alinhamento: 'direita' }, { titulo: 'Total', largura: 1.7, alinhamento: 'direita' } ],
      linhas: Array.from({ length: 12 }, (_, indice) => {
        const competencia = `${ano}-${String(indice + 1).padStart(2, '0')}-01`;
        const registros = receitas.filter(item => item.competencia === competencia);
        const ajustesMes = ajustesNumericos.filter(item => item.competencia === competencia);
        const resumo = totalizarReceitas(registros, ajustesMes);
        const totalAjustes = ajustesMes.reduce((soma, item) => soma + item.valor, 0);
        return [nomeMes(competencia), moeda(resumo.comercio), moeda(resumo.servicos), moeda(resumo.total - resumo.comercio - resumo.servicos - totalAjustes), moeda(totalAjustes), moeda(resumo.total)];
      }),
    }, {
      titulo: 'Detalhamento das receitas',
      colunas: [{ titulo: 'Data', largura: 1.1 }, { titulo: 'Mês', largura: 0.9 }, { titulo: 'Atividade', largura: 1.5 }, { titulo: 'Documento', largura: 1.4 }, { titulo: 'Descrição', largura: 2.4 }, { titulo: 'Valor', largura: 1.4, alinhamento: 'direita' }],
      linhas: receitas.map(item => [dataBr(item.data_movimento), nomeMes(item.competencia), item.atividade_receita, item.numero_documento, item.descricao, moeda(item.valor)]),
    }, {
      titulo: 'Ajustes justificados',
      colunas: [{ titulo: 'Competência', largura: 1.4 }, { titulo: 'Justificativa', largura: 5 }, { titulo: 'Valor', largura: 1.5, alinhamento: 'direita' }],
      linhas: ajustesNumericos.map(item => [nomeMes(item.competencia), item.justificativa, moeda(item.valor)]),
    }];
    return responderPdf({
      titulo: 'Relatório de faturamento MEI',
      subtitulo: `Ano-calendário ${ano} - controle interno do escritório`,
      identificacao: [['Cliente', cliente.razao_social], ['CPF / CNPJ', cliente.cpf_cnpj], ['Ano-calendário', String(ano)]],
      indicadores: [['Comércio e indústria', moeda(totais.comercio)], ['Serviços', moeda(totais.servicos)], ['Ajustes justificados', moeda(somatorioAjustes)], ['Total anual de receitas (com ajustes)', moeda(totais.total)], ['Limite efetivo parametrizado', limite === null ? 'Não configurado' : moeda(limite)], ['Percentual do limite', limite && limite > 0 ? `${(totais.total / limite * 100).toFixed(1).replace('.', ',')}%` : 'Não disponível']],
      tabelas,
      observacoes: ['Relatório de controle interno. Não substitui DASN-SIMEI, documentos fiscais ou obrigações oficiais.', 'O limite anual é obtido de regra aprovada no cadastro de parâmetros do escritório.'],
      orientacao: 'retrato',
    }, `faturamento-mei-${ano}-${cliente.id}`);
  }

  const registros = movimentos.filter(item => tipo === 'convencional' ? porId[item.cliente_id]?.regime_tributario !== 'MEI' && Boolean(porId[item.cliente_id]) : Boolean(porId[item.cliente_id]));
  const somar = (movimento: string) => registros.filter(item => item.tipo_movimento === movimento).reduce((soma, item) => soma + Number(item.valor), 0);
  return responderPdf({
    titulo: tipo === 'convencional' ? 'Relatório de faturamento convencional' : 'Relatório geral de faturamento',
    subtitulo: `Competência ${nomeMes(mes)} - controle interno do escritório`,
    identificacao: [['Competência', nomeMes(mes)], ['Clientes considerados', String(new Set(registros.map(item => item.cliente_id)).size)]],
    indicadores: [['Receitas', moeda(somar('RECEITA'))], ['Entradas', moeda(somar('ENTRADA'))], ['Despesas', moeda(somar('DESPESA'))]],
    tabelas: [{
      titulo: 'Lançamentos do período',
      colunas: [{ titulo: 'Cliente', largura: 2 }, { titulo: 'CPF / CNPJ', largura: 1.35 }, { titulo: 'Data', largura: 0.85 }, { titulo: 'Tipo', largura: 0.8 }, { titulo: 'Atividade', largura: 1.1 }, { titulo: 'Documento', largura: 1 }, { titulo: 'Descrição', largura: 1.7 }, { titulo: 'Valor', largura: 1.05, alinhamento: 'direita' }],
      linhas: registros.map(item => [porId[item.cliente_id]?.razao_social, porId[item.cliente_id]?.cpf_cnpj, dataBr(item.data_movimento), item.tipo_movimento, item.atividade_receita, item.numero_documento, item.descricao, moeda(Number(item.valor))]),
    }],
    observacoes: ['Entradas e despesas são exibidas separadamente e não compõem o faturamento.', 'Relatório gerencial interno; não representa apuração tributária.'],
    orientacao: 'paisagem',
  }, `faturamento-${tipo}-${mes}`);
}
