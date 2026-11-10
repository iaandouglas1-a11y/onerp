import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Gerador de relatórios PDF sem armazenamento de dados no navegador.
// Acesso às movimentações e permissão do escritório são verificados na rota.
const CORES = {
  fundo: rgb(1, 1, 1),
  texto: rgb(0.039, 0.067, 0.110), // #0A111C
  verde: rgb(0.486, 0.725, 0.235), // #7CB93C
  ambar: rgb(0.902, 0.624, 0.000),
  vermelho: rgb(0.820, 0.239, 0.239),
  faixaTabela: rgb(0.936, 0.947, 0.960),
  cinza: rgb(0.604, 0.647, 0.706), // #9AA5B4
  claro: rgb(0.957, 0.965, 0.973), // #F4F6F8
  borda: rgb(0.82, 0.85, 0.88),
};

type Orientacao = 'retrato' | 'paisagem';
type Alinhamento = 'esquerda' | 'direita';
export type ColunaRelatorio = { titulo: string; largura: number; alinhamento?: Alinhamento };
export type LinhaRelatorio = (string | number | null | undefined)[];
export type TabelaRelatorio = { titulo: string; colunas: ColunaRelatorio[]; linhas: LinhaRelatorio[] };
export type RelatorioPdf = {
  titulo: string;
  subtitulo: string;
  identificacao: Array<[string, string]>;
  indicadores: Array<[string, string]>;
  tabelas: TabelaRelatorio[];
  observacoes: string[];
  orientacao: Orientacao;
};

async function carregarLogo(documento: PDFDocument) {
  // Marca institucional, separada da identidade visual do aplicativo On ERP.
  const caminho = join(process.cwd(), 'public', 'marca', 'on-contabilidade-relatorios-branca.png');
  const conteudo = await readFile(caminho);
  return documento.embedPng(conteudo);
}

function percentual(valor: number | null | undefined): string {
  return valor == null || !Number.isFinite(valor)
    ? '—'
    : `${(valor * 100).toFixed(1).replace('.', ',')}%`;
}

function corPercentual(valor: number | null | undefined) {
  if (valor == null || !Number.isFinite(valor)) return CORES.cinza;
  if (valor <= 0.8) return CORES.verde;
  if (valor <= 1) return CORES.ambar;
  return CORES.vermelho;
}

function textoSeguro(valor: unknown): string {
  // Fontes padrão PDF utilizam WinAnsi: substitui apenas caracteres não suportados.
  return String(valor ?? '—')
    .replace(/[‐-―]/g, '-')
    .replace(/[•]/g, '-')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cortarTexto(texto: string, fonte: PDFFont, tamanho: number, largura: number): string {
  const valor = textoSeguro(texto);
  if (fonte.widthOfTextAtSize(valor, tamanho) <= largura) return valor;
  const reticencias = '...';
  let fim = valor.length;
  while (fim > 0 && fonte.widthOfTextAtSize(valor.slice(0, fim) + reticencias, tamanho) > largura) fim--;
  return valor.slice(0, fim) + reticencias;
}

export async function gerarRelatorioPdf(conteudo: RelatorioPdf): Promise<Uint8Array> {
  const documento = await PDFDocument.create();
  documento.setTitle(textoSeguro(conteudo.titulo));
  documento.setAuthor('On Contabilidade');
  documento.setCreator('On Contabilidade');
  documento.setSubject('Relatório gerencial de faturamento');
  const normal = await documento.embedFont(StandardFonts.Helvetica);
  const negrito = await documento.embedFont(StandardFonts.HelveticaBold);
  const logo = await carregarLogo(documento);
  const [larguraPagina, alturaPagina] = conteudo.orientacao === 'paisagem' ? [841.89, 595.28] : [595.28, 841.89];
  const margem = 38;
  const larguraUtil = larguraPagina - 2 * margem;
  const baseRodape = 30;
  // A primeira página é criada antes de qualquer operação de desenho.
  // Isso evita o erro TS2454 (variável usada antes da atribuição).
  let pagina: PDFPage = documento.addPage([larguraPagina, alturaPagina]);
  let y = 0;
  let numeroPagina = 0;

  function escrever(valor: unknown, x: number, topo: number, tamanho = 9, fonte: PDFFont = normal, cor = CORES.texto) {
    pagina.drawText(textoSeguro(valor), { x, y: topo - tamanho, size: tamanho, font: fonte, color: cor });
  }

  function novaPagina() {
    // Reutiliza a primeira página; as seguintes são criadas apenas quando necessárias.
    if (numeroPagina > 0) {
      pagina = documento.addPage([larguraPagina, alturaPagina]);
    }
    numeroPagina++;
    pagina.drawRectangle({ x: 0, y: alturaPagina - 7, width: larguraPagina, height: 7, color: CORES.verde });
    pagina.drawImage(logo, { x: margem, y: alturaPagina - 84, width: 84, height: 70 });
    escrever('RELATÓRIOS', larguraPagina - margem - 67, alturaPagina - 40, 8, normal, CORES.cinza);
    pagina.drawLine({ start: { x: margem, y: alturaPagina - 87 }, end: { x: larguraPagina - margem, y: alturaPagina - 87 }, thickness: 0.8, color: CORES.borda });
    y = alturaPagina - 108;
  }

  function garantirEspaco(altura: number, repetirCabecalho?: () => void) {
    if (y - altura < baseRodape + 16) {
      novaPagina();
      repetirCabecalho?.();
    }
  }

  function tituloSecao(titulo: string) {
    garantirEspaco(36);
    escrever(titulo, margem, y, 11, negrito);
    y -= 26;
  }

  function desenharTabela(tabela: TabelaRelatorio) {
    tituloSecao(tabela.titulo);
    const soma = tabela.colunas.reduce((total, coluna) => total + coluna.largura, 0);
    const larguras = tabela.colunas.map(coluna => larguraUtil * coluna.largura / soma);
    const alturaLinha = 24;
    const tamanho = conteudo.orientacao === 'paisagem' ? 7.4 : 8;
    function cabecalho() {
      pagina.drawRectangle({ x: margem, y: y - 27, width: larguraUtil, height: 27, color: CORES.claro });
      let posX = margem;
      tabela.colunas.forEach((coluna, indice) => {
        const valor = cortarTexto(coluna.titulo, negrito, tamanho, larguras[indice] - 11);
        const alinhado = coluna.alinhamento === 'direita';
        const larguraTexto = negrito.widthOfTextAtSize(valor, tamanho);
        escrever(valor, alinhado ? posX + larguras[indice] - 6 - larguraTexto : posX + 6, y - 7, tamanho, negrito);
        posX += larguras[indice];
      });
      y -= 28;
    }
    garantirEspaco(80);
    cabecalho();
    if (!tabela.linhas.length) {
      garantirEspaco(alturaLinha, cabecalho);
      escrever('Nenhum lançamento no período.', margem + 6, y - 5, tamanho, normal, CORES.cinza);
      y -= alturaLinha;
    }
    for (let indiceLinha = 0; indiceLinha < tabela.linhas.length; indiceLinha++) {
      garantirEspaco(alturaLinha + 2, cabecalho);
      if (indiceLinha % 2 === 1) pagina.drawRectangle({ x: margem, y: y - alturaLinha, width: larguraUtil, height: alturaLinha, color: rgb(0.986, 0.99, 0.992) });
      let posX = margem;
      tabela.linhas[indiceLinha].slice(0, tabela.colunas.length).forEach((celula, indiceColuna) => {
        const valor = cortarTexto(String(celula ?? ''), normal, tamanho, larguras[indiceColuna] - 11);
        const larguraTexto = normal.widthOfTextAtSize(valor, tamanho);
        const alinhado = tabela.colunas[indiceColuna].alinhamento === 'direita';
        escrever(valor, alinhado ? posX + larguras[indiceColuna] - 6 - larguraTexto : posX + 6, y - 6, tamanho);
        posX += larguras[indiceColuna];
      });
      pagina.drawLine({ start: { x: margem, y: y - alturaLinha }, end: { x: margem + larguraUtil, y: y - alturaLinha }, thickness: 0.4, color: CORES.borda });
      y -= alturaLinha;
    }
    y -= 22;
  }

  novaPagina();
  escrever(conteudo.titulo, margem, y, 17, negrito);
  y -= 27;
  escrever(conteudo.subtitulo, margem, y, 9, normal, CORES.cinza);
  y -= 27;
  for (const [rotulo, valor] of conteudo.identificacao) {
    garantirEspaco(18);
    escrever(`${rotulo}:`, margem, y, 9, negrito);
    escrever(valor, margem + 112, y, 9);
    y -= 17;
  }
  y -= 12;
  if (conteudo.indicadores.length) {
    tituloSecao('Resumo do período');
    for (const [rotulo, valor] of conteudo.indicadores) {
      garantirEspaco(22);
      escrever(rotulo, margem + 8, y - 3, 9);
      const valorTratado = textoSeguro(valor);
      const larguraTexto = negrito.widthOfTextAtSize(valorTratado, 9);
      escrever(valorTratado, larguraPagina - margem - 8 - larguraTexto, y - 3, 9, negrito);
      pagina.drawLine({ start: { x: margem, y: y - 21 }, end: { x: larguraPagina - margem, y: y - 21 }, thickness: 0.4, color: CORES.borda });
      y -= 26;
    }
    y -= 8;
  }
  for (const tabela of conteudo.tabelas) desenharTabela(tabela);
  if (conteudo.observacoes.length) {
    tituloSecao('Observações');
    for (const observacao of conteudo.observacoes) {
      garantirEspaco(20);
      escrever(cortarTexto(observacao, normal, 8, larguraUtil), margem, y, 8, normal, CORES.cinza);
      y -= 16;
    }
  }
  // Rodapé em todas as páginas. A numeração é resolvida após criar o documento inteiro.
  const paginas = documento.getPages();
  paginas.forEach((folha, indice) => {
    folha.drawLine({ start: { x: margem, y: 41 }, end: { x: larguraPagina - margem, y: 41 }, thickness: 0.6, color: CORES.borda });
    folha.drawText('On Contabilidade', { x: margem, y: 26, size: 7, font: normal, color: CORES.cinza });
    const paginaTexto = `Página ${indice + 1} de ${paginas.length}`;
    folha.drawText(paginaTexto, { x: larguraPagina - margem - normal.widthOfTextAtSize(paginaTexto, 7), y: 26, size: 7, font: normal, color: CORES.cinza });
  });
  return documento.save();
}


/** Relatório MEI de síntese: 12 competências, limite anual e evolução acumulada. */
export type LinhaMensalMei = { mes: string; total: number; percentualAcumulado: number | null };
export type RelatorioMeiPdf = {
  ano: number;
  cliente: string;
  documentoCliente: string;
  receitaAnual: number;
  limiteAnual: number | null;
  percentualAnual: number | null;
  meses: LinhaMensalMei[];
};

export async function gerarRelatorioMeiPdf(dados: RelatorioMeiPdf): Promise<Uint8Array> {
  if (dados.meses.length !== 12) throw new Error('O relatório MEI exige 12 competências.');
  const documento = await PDFDocument.create();
  documento.setTitle(`Faturamento MEI - ${dados.ano}`);
  documento.setAuthor('On Contabilidade');
  documento.setCreator('On Contabilidade');
  const normal = await documento.embedFont(StandardFonts.Helvetica);
  const negrito = await documento.embedFont(StandardFonts.HelveticaBold);
  const logo = await carregarLogo(documento);
  const pagina = documento.addPage([595.28, 841.89]);
  const larguraPagina = 595.28;
  const margem = 38;
  const largura = larguraPagina - margem * 2;
  const formatarMoeda = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  function escrever(valor: unknown, x: number, y: number, tamanho = 9, negritoTexto = false, cor = CORES.texto) {
    const fonte = negritoTexto ? negrito : normal;
    pagina.drawText(textoSeguro(valor), { x, y, size: tamanho, font: fonte, color: cor });
  }

  function escreverDireita(valor: unknown, extremo: number, y: number, tamanho = 9, negritoTexto = false, cor = CORES.texto) {
    const fonte = negritoTexto ? negrito : normal;
    const texto = textoSeguro(valor);
    escrever(texto, extremo - fonte.widthOfTextAtSize(texto, tamanho), y, tamanho, negritoTexto, cor);
  }

  function caixa(x: number, y: number, w: number, h: number, cor = CORES.claro) {
    pagina.drawRectangle({ x, y, width: w, height: h, color: cor });
  }

  function barraProgresso(x: number, y: number, w: number, h: number, proporcao: number | null) {
    // A escala principal representa sempre 100% do limite aplicável.
    // A parte não utilizada permanece cinza, inclusive quando o faturamento é zero.
    caixa(x, y, w, h, CORES.claro);
    if (proporcao == null || !Number.isFinite(proporcao)) return;
    const utilizado = Math.max(0, proporcao);
    if (utilizado > 0) {
      pagina.drawRectangle({ x, y, width: w * Math.min(1, utilizado), height: h, color: CORES.verde });
    }
    if (utilizado > 1) {
      // Uma segunda faixa vermelha indica excedente, sem alterar a escala de 100%.
      const larguraExcedente = Math.min(w, w * (utilizado - 1));
      pagina.drawRectangle({ x, y: y - 4, width: larguraExcedente, height: 3, color: CORES.vermelho });
    }
  }

  // Cabeçalho visual da marca, sem o texto "On ERP".
  caixa(0, 835.89, larguraPagina, 6, CORES.verde);
  // A imagem institucional é recortada para eliminar margens transparentes.
  // Assim a marca permanece grande, nítida e proporcional, sem encostar no título.
  const larguraLogo = 86;
  const alturaLogo = larguraLogo * (logo.height / logo.width);
  const xLogo = margem;
  const yLogo = 762;
  pagina.drawImage(logo, { x: xLogo, y: yLogo, width: larguraLogo, height: alturaLogo });
  const xTitulo = xLogo + larguraLogo + 18;
  escrever('RELATÓRIO DE FATURAMENTO MEI', xTitulo, 795, 13, true);
  escrever(`Ano-calendário ${dados.ano}`, xTitulo, 778, 9, false, CORES.cinza);
  pagina.drawLine({ start: { x: margem, y: 741 }, end: { x: larguraPagina - margem, y: 741 }, thickness: 0.7, color: CORES.borda });

  escrever('CLIENTE', margem, 719, 8, true, CORES.cinza);
  escrever(cortarTexto(dados.cliente, negrito, 11, largura), margem, 700, 11, true);
  escrever(`CPF/CNPJ: ${dados.documentoCliente}`, margem, 682, 9, false, CORES.cinza);

  escrever('Resumo do período', margem, 648, 11, true);
  const espacamento = 9;
  const larguraCartao = (largura - 2 * espacamento) / 3;
  const indicadores = [
    { rotulo: 'Faturamento anual', valor: formatarMoeda(dados.receitaAnual), cor: CORES.texto },
    { rotulo: 'Limite do ano', valor: dados.limiteAnual == null ? 'Não configurado' : formatarMoeda(dados.limiteAnual), cor: CORES.texto },
    { rotulo: 'Limite utilizado', valor: percentual(dados.percentualAnual), cor: corPercentual(dados.percentualAnual) },
  ];
  indicadores.forEach(({ rotulo, valor, cor }, indice) => {
    const x = margem + (larguraCartao + espacamento) * indice;
    caixa(x, 565, larguraCartao, 65);
    escrever(rotulo, x + 11, 608, 8, false, CORES.cinza);
    escrever(cortarTexto(valor, negrito, 12, larguraCartao - 20), x + 11, 584, 12, true, cor);
  });

  escrever('Progressão anual do limite', margem, 537, 9, true);
  escreverDireita(percentual(dados.percentualAnual), larguraPagina - margem, 537, 9, true, corPercentual(dados.percentualAnual));
  barraProgresso(margem, 519, largura, 10, dados.percentualAnual);
  escrever(dados.limiteAnual == null ? 'Limite não configurado' : `100% = ${formatarMoeda(dados.limiteAnual)} (limite efetivo)`, margem, 505, 8, false, CORES.cinza);
  if (dados.limiteAnual != null && dados.limiteAnual > 0) {
    const diferenca = dados.limiteAnual - dados.receitaAnual;
    const situacao = diferenca >= 0 ? `Disponível para faturar: ${formatarMoeda(diferenca)}` : `Limite excedido em: ${formatarMoeda(-diferenca)}`;
    escreverDireita(situacao, larguraPagina - margem, 505, 8, true, diferenca >= 0 ? CORES.cinza : CORES.vermelho);
  }

  escrever('Faturamento mensal por atividade', margem, 482, 11, true);
  const topoTabela = 460;
  const alturaCabecalho = 27;
  const alturaLinha = 22;
  // Tabela MEI mais compacta, centralizada no A4 e com colunas proporcionais.
  // Apenas a distribuição horizontal é modificada; cálculos e demais blocos do PDF permanecem intactos.
  const larguraTabela = 430;
  const inicioTabela = margem + (largura - larguraTabela) / 2;
  const limiteColunaTotal = inicioTabela + 110 + 154 - 12;
  const limiteColunaPercentual = inicioTabela + larguraTabela - 12;
  caixa(inicioTabela, topoTabela - alturaCabecalho, larguraTabela, alturaCabecalho);
  escrever('Mês', inicioTabela + 12, topoTabela - 18, 9, true);
  escreverDireita('Total', limiteColunaTotal, topoTabela - 18, 9, true);
  escreverDireita('Progressão do limite (%)', limiteColunaPercentual, topoTabela - 18, 8.5, true);

  dados.meses.forEach((item, indice) => {
    const topo = topoTabela - alturaCabecalho - indice * alturaLinha;
    const fundo = topo - alturaLinha;
    if (indice % 2 === 1) caixa(inicioTabela, fundo, larguraTabela, alturaLinha, CORES.faixaTabela);
    escrever(item.mes, inicioTabela + 12, fundo + 7, 9);
    escreverDireita(formatarMoeda(item.total), limiteColunaTotal, fundo + 7, 9);
    escreverDireita(percentual(item.percentualAcumulado), limiteColunaPercentual, fundo + 7, 8.5, true, corPercentual(item.percentualAcumulado));
    pagina.drawLine({ start: { x: inicioTabela, y: fundo }, end: { x: inicioTabela + larguraTabela, y: fundo }, thickness: 0.5, color: CORES.borda });
  });

  const baseTotal = topoTabela - alturaCabecalho - dados.meses.length * alturaLinha - 28;
  caixa(inicioTabela, baseTotal, larguraTabela, 30);
  escrever('TOTAL ANUAL', inicioTabela + 12, baseTotal + 11, 9, true);
  escreverDireita(formatarMoeda(dados.receitaAnual), limiteColunaTotal, baseTotal + 11, 9, true);
  escreverDireita(percentual(dados.percentualAnual), limiteColunaPercentual, baseTotal + 10, 8.5, true, corPercentual(dados.percentualAnual));
  if (baseTotal < 53) throw new Error('Falha de diagramação: relatório MEI excedeu uma página.');

  pagina.drawLine({ start: { x: margem, y: 43 }, end: { x: larguraPagina - margem, y: 43 }, thickness: 0.6, color: CORES.borda });
  escrever('On Contabilidade', margem, 28, 8, false, CORES.cinza);
  escreverDireita('Página 1 de 1', larguraPagina - margem, 28, 8, false, CORES.cinza);
  if (documento.getPageCount() !== 1) throw new Error('Relatório MEI deve conter uma página.');
  return documento.save();
}
