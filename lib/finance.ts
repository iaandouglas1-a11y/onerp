import type { Movimentacao } from "@/types/database";
export function signedValue(mov: Pick<Movimentacao, "tipo" | "valor">) { return mov.tipo === "receita" ? Number(mov.valor) : -Number(mov.valor); }
export function isTransferencia(mov: { categorias?: { nome?: string | null } | null; descricao?: string | null }) {
  const normalizar = (valor: string | null | undefined) =>
    String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
  const categoria = normalizar(mov.categorias?.nome);
  const descricao = normalizar(mov.descricao);

  // Aceita tanto registros novos quanto transferências antigas salvas sem
  // acento ou com pequenas variações na descrição.
  return categoria.includes("transferencia")
    || descricao.includes("transferencia entre contas")
    || /transferencia.*\((saida|entrada)\)$/.test(descricao);
}
export function accountBalance(contaId: string, movs: Movimentacao[]) { return movs.filter((m) => m.conta_id === contaId && m.status === "realizado").reduce((sum, m) => sum + signedValue(m), 0); }
export function totalBalance(movs: Movimentacao[]) { return movs.filter((m) => m.conta_id && m.status === "realizado").reduce((sum, m) => sum + signedValue(m), 0); }
export const ANTECIPACAO_FATURA_PREFIX = "[ONFIN_ANTECIPACAO_FATURA]";
export function isAntecipacaoFatura(mov: { descricao?: string | null }) {
  return String(mov.descricao ?? "").startsWith(ANTECIPACAO_FATURA_PREFIX);
}
export function invoiceTotal(faturaId: string, movs: Movimentacao[]) {
  return movs
    .filter((m) => m.fatura_id === faturaId && m.tipo === "despesa" && !isAntecipacaoFatura(m))
    .reduce((sum, m) => sum + Number(m.valor), 0);
}
export function invoiceAnticipated(faturaId: string, movs: Movimentacao[]) {
  return movs
    .filter((m) => m.fatura_id === faturaId && m.tipo === "despesa" && isAntecipacaoFatura(m))
    .reduce((sum, m) => sum + Number(m.valor), 0);
}
export function invoiceRemaining(faturaId: string, movs: Movimentacao[]) {
  return Math.max(0, invoiceTotal(faturaId, movs) - invoiceAnticipated(faturaId, movs));
}
export function monthBounds(date = new Date()) { const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1)); const end = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0)); return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }; }
