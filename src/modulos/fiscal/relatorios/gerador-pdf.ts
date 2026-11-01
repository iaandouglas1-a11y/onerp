import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

// Gerador de relatórios PDF sem armazenamento de dados no navegador.
// Acesso às movimentações e permissão do escritório são verificados na rota.
const CORES = {
  fundo: rgb(1, 1, 1),
  texto: rgb(0.039, 0.067, 0.110), // #0A111C
  verde: rgb(0.486, 0.725, 0.235), // #7CB93C
  cinza: rgb(0.604, 0.647, 0.706), // #9AA5B4
  claro: rgb(0.957, 0.965, 0.973), // #F4F6F8
  borda: rgb(0.86, 0.89, 0.91),
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
  documento.setCreator('On ERP');
  documento.setSubject('Relatório gerencial de faturamento');
  const normal = await documento.embedFont(StandardFonts.Helvetica);
  const negrito = await documento.embedFont(StandardFonts.HelveticaBold);
  const [larguraPagina, alturaPagina] = conteudo.orientacao === 'paisagem' ? [841.89, 595.28] : [595.28, 841.89];
  const margem = 38;
  const larguraUtil = larguraPagina - 2 * margem;
  const baseRodape = 30;
  let pagina: PDFPage;
  let y = 0;
  let numeroPagina = 0;

  function escrever(valor: unknown, x: number, topo: number, tamanho = 9, fonte: PDFFont = normal, cor = CORES.texto) {
    pagina.drawText(textoSeguro(valor), { x, y: topo - tamanho, size: tamanho, font: fonte, color: cor });
  }

  function novaPagina() {
    pagina = documento.addPage([larguraPagina, alturaPagina]);
    numeroPagina++;
    pagina.drawRectangle({ x: 0, y: alturaPagina - 7, width: larguraPagina, height: 7, color: CORES.verde });
    escrever('On ERP', margem, alturaPagina - 30, 15, negrito);
    escrever('ON CONTABILIDADE', margem + 70, alturaPagina - 28, 8, normal, CORES.cinza);
    pagina.drawLine({ start: { x: margem, y: alturaPagina - 54 }, end: { x: larguraPagina - margem, y: alturaPagina - 54 }, thickness: 0.8, color: CORES.borda });
    y = alturaPagina - 74;
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
    folha.drawText('On ERP - Relatório interno', { x: margem, y: 26, size: 7, font: normal, color: CORES.cinza });
    const paginaTexto = `Página ${indice + 1} de ${paginas.length}`;
    folha.drawText(paginaTexto, { x: larguraPagina - margem - normal.widthOfTextAtSize(paginaTexto, 7), y: 26, size: 7, font: normal, color: CORES.cinza });
  });
  return documento.save();
}
