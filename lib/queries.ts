import { unstable_noStore as noStore } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import { isTransferencia, monthBounds } from "@/lib/finance";
import type { Movimentacao, Conta, Categoria, Cartao, Fatura, FaturaExtendida } from "@/types/database";

export async function getCategorias() { 
  noStore(); 
  const s = await createServerSupabaseClient(); 
  const { data, error } = await s.from("categorias").select("*").order("nome"); 
  if (error) throw error; 
  return data as Categoria[]; 
}

export async function getContasWithMovs() { 
  noStore(); 
  const s = await createServerSupabaseClient(); 
  const [contas, movs, itens] = await Promise.all([
    s.from("contas").select("*").order("nome"), 
    s.from("movimentacoes").select("*"),
    (s.from("financeiro_itens") as any).select("id, ativo")
  ]); 
  if (contas.error) throw contas.error; 
  if (movs.error) throw movs.error;
  const ativoPorId = new Map((itens.data || []).map((i: any) => [i.id, i.ativo !== false]));
  return { 
    contas: (contas.data || []).map((c: any) => ({ ...c, ativo: ativoPorId.get(c.id) ?? true })) as Conta[],
    movimentacoes: (movs.data || []) as Movimentacao[] 
  }; 
}

export async function getMovimentacoes(filters?: { inicio?: string; fim?: string; tipo?: "receita" | "despesa" | ""; categoriaId?: string; contaId?: string }) {
  noStore(); 
  const s = await createServerSupabaseClient(); 
  let q = s.from("movimentacoes").select("*, categorias(nome, icone), contas(nome), cartoes(nome), faturas(data_vencimento)").order("data", { ascending: false });
  if (filters?.inicio) q = q.gte("data", filters.inicio); 
  if (filters?.fim) q = q.lte("data", filters.fim); 
  if (filters?.tipo) q = q.eq("tipo", filters.tipo); 
  if (filters?.categoriaId) q = q.eq("categoria_id", filters.categoriaId); 
  if (filters?.contaId) q = q.eq("conta_id", filters.contaId);
  const { data, error } = await q; 
  if (error) throw error; 
  return (data || []) as any[]; 
}

export async function getDashboardData(filters?: { inicio?: string; fim?: string }) { 
  noStore(); 
  const s = await createServerSupabaseClient(); 
  const b = monthBounds(); 
  const start = filters?.inicio || b.start;
  const end = filters?.fim || b.end;
  const [allMovs, monthMovs] = await Promise.all([
    s.from("movimentacoes").select("*, categorias(nome, icone)"),
    s.from("movimentacoes").select("*, categorias(nome, icone)").gte("data", start).lte("data", end)
  ]); 
  if (allMovs.error) throw allMovs.error; 
  if (monthMovs.error) throw monthMovs.error; 
  return { 
    allMovs: (allMovs.data || []) as Movimentacao[], 
    monthMovs: (monthMovs.data || []) as any[],
    filtro: { start, end }
  }; 
}

export async function getCartoesEFaturas(filters?: { inicio?: string; fim?: string }) { 
  noStore(); 
  const s = await createServerSupabaseClient(); 
  let faturasQuery = s.from("faturas").select("*").order("data_vencimento", { ascending: false });
  if (filters?.inicio) faturasQuery = faturasQuery.gte("data_vencimento", filters.inicio);
  if (filters?.fim) faturasQuery = faturasQuery.lte("data_vencimento", filters.fim);
  const [cartoes, faturas, movs, itens] = await Promise.all([
    s.from("cartoes").select("*, contas(nome)").order("nome"), 
    faturasQuery, 
    s.from("movimentacoes").select("*, categorias(nome, icone)").order("data", { ascending: false }),
    (s.from("financeiro_itens") as any).select("id, ativo")
  ]); 
  if (cartoes.error) throw cartoes.error; 
  if (faturas.error) throw faturas.error; 
  if (movs.error) throw movs.error;
  const ativoPorId = new Map((itens.data || []).map((i: any) => [i.id, i.ativo !== false]));
  return { 
    cartoes: (cartoes.data || []).map((c: any) => ({ ...c, ativo: ativoPorId.get(c.id) ?? true })) as any[],
    faturas: (faturas.data || []) as FaturaExtendida[], 
    movimentacoes: (movs.data || []) as any[] 
  }; 
}

export function monthlyDre(movs: Movimentacao[]) { 
  const map = new Map<string, { mes: string; receitas: number; despesas: number; resultado: number }>(); 
  for (const m of movs) { 
    if (isTransferencia(m as any)) continue;
    const mes = m.data.slice(0, 7); 
    const row = map.get(mes) ?? { mes, receitas: 0, despesas: 0, resultado: 0 }; 
    if (m.tipo === "receita") row.receitas += Number(m.valor); 
    else row.despesas += Number(m.valor); 
    row.resultado = row.receitas - row.despesas; 
    map.set(mes, row); 
  } 
  return [...map.values()].sort((a, b) => a.mes.localeCompare(b.mes)); 
}

// ── Dívidas ───────────────────────────────────────────────
import type { Divida, DividaPagamento } from "@/types/database";

export async function getDividas() {
  noStore();
  const s = await createServerSupabaseClient();
  const [dividas, pagamentos] = await Promise.all([
    s.from("dividas").select("*").order("data", { ascending: true }),
    s.from("divida_pagamentos").select("*").order("data", { ascending: true }),
  ]);
  if (dividas.error) throw dividas.error;
  if (pagamentos.error) throw pagamentos.error;
  return {
    dividas:    (dividas.data    || []) as Divida[],
    pagamentos: (pagamentos.data || []) as DividaPagamento[],
  };
}

// ── Investimentos ─────────────────────────────────────────
import type { Investimento, InvestimentoMovimento, InvestimentoSaldo } from "@/types/database";

export async function getInvestimentos() {
  noStore();
  const s = await createServerSupabaseClient();
  const [invs, movs] = await Promise.all([
    s.from("investimentos").select("*, contas(nome)").order("nome"),
    s.from("investimento_movimentos").select("*").order("data", { ascending: false }),
  ]);
  if (invs.error) throw invs.error;
  if (movs.error) throw movs.error;
  return {
    investimentos: (invs.data || []) as (Investimento & { contas: { nome: string } | null })[],
    movimentos:    (movs.data || []) as InvestimentoMovimento[],
  };
}

export async function getInvestimentoSaldos() {
  noStore();
  const s = await createServerSupabaseClient();
  const { data, error } = await s
    .from("investimento_saldos")
    .select("*")
    .order("mes", { ascending: true });
  if (error) throw error;
  return { saldos: (data || []) as InvestimentoSaldo[] };
}

// ── Honorários ─────────────────────────────────────────────
import type { Honorario } from "@/types/database";
import type { Cliente } from "@/types/database";

export async function getHonorarios() {
  noStore();
  const s = await createServerSupabaseClient();
  const [honorariosRes, clientesRes] = await Promise.all([
    s.from("honorarios").select("*").order("vencimento", { ascending: true }),
    (s.from("clientes") as any).select("id, nome, ativo").order("nome"),
  ]);
  if (honorariosRes.error) throw honorariosRes.error;
  if (clientesRes.error) throw clientesRes.error;
  return {
    honorarios: (honorariosRes.data || []) as Honorario[],
    clientes:   (clientesRes.data || []) as Pick<Cliente, "id" | "nome">[],
  };
}

// ── Notas ─────────────────────────────────────────────────
import type { Nota } from "@/types/database";

export async function getNotas(status?: "ativa" | "arquivada") {
  noStore();
  const s = await createServerSupabaseClient();
  let q = s.from("notas").select("*").order("fixada", { ascending: false }).order("updated_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as Nota[];
}

export async function getNota(id: string) {
  noStore();
  const s = await createServerSupabaseClient();
  const { data, error } = await s.from("notas").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Nota;
}

// ── Orçamento ─────────────────────────────────────────────
import type { OrcamentoItem, OrcamentoParcela } from "@/types/database";

// Itens (receita/despesa fixo ou variável) da competência + todas as compras
// parceladas cadastradas — quais parcelas estão ativas naquele mês é decidido
// por parcelaInfoParaMes(), sem precisar de um registro por mês.
export async function getOrcamento(competencia: string) {
  noStore();
  const s = await createServerSupabaseClient();
  const inicio = `${competencia.slice(0, 7)}-01`;
  const [itensRes, parcelasRes] = await Promise.all([
    s.from("orcamento_itens").select("*, categorias(nome, icone)").eq("competencia", inicio),
    s.from("orcamento_parcelas").select("*, categorias(nome, icone)").order("data_primeira_parcela", { ascending: true }),
  ]);
  if (itensRes.error) throw itensRes.error;
  if (parcelasRes.error) throw parcelasRes.error;
  return {
    itens:    (itensRes.data    || []) as (OrcamentoItem & { categorias: { nome: string } | null })[],
    parcelas: (parcelasRes.data || []) as (OrcamentoParcela & { categorias: { nome: string } | null })[],
  };
}

// Calcula se uma parcela está ativa numa competência e qual o número dela
// (ex: "3 de 5") a partir da data da 1ª parcela e do total de parcelas.
export function parcelaInfoParaMes(parcela: OrcamentoParcela, competencia: string) {
  const [anoI, mesI] = parcela.data_primeira_parcela.slice(0, 7).split("-").map(Number);
  const [anoC, mesC] = competencia.slice(0, 7).split("-").map(Number);
  const diffMeses = (anoC - anoI) * 12 + (mesC - mesI);
  const ativa = diffMeses >= 0 && diffMeses < parcela.parcelas_total;
  return { ativa, parcelaAtual: diffMeses + 1, parcelasTotal: parcela.parcelas_total };
}

// Soma o realizado (despesas já lançadas em Movimentações) por categoria dentro
// do mês — base do bloco "Orçado x realizado".
export async function getRealizadoPorCategoria(competencia: string) {
  noStore();
  const s = await createServerSupabaseClient();
  const inicio = `${competencia.slice(0, 7)}-01`;
  const [ano, mes] = inicio.split("-").map(Number);
  const fim = new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);

  const { data, error } = await s
    .from("movimentacoes")
    .select("categoria_id, valor, categorias(nome)")
    .eq("tipo", "despesa")
    .eq("status", "realizado")
    .gte("data", inicio)
    .lte("data", fim);
  if (error) throw error;

  const map = new Map<string, number>();
  for (const m of (data || []) as any[]) {
    if (isTransferencia(m)) continue;
    if (!m.categoria_id) continue;
    map.set(m.categoria_id, (map.get(m.categoria_id) || 0) + Number(m.valor));
  }
  return map;
}

// Média mensal gasta numa categoria nos últimos `meses` — usada para sugerir o
// valor de um custo variável ao criá-lo no Orçamento.
export async function getMediaGastoCategoria(categoriaId: string, meses = 3) {
  noStore();
  const s = await createServerSupabaseClient();
  const hoje = new Date();
  const inicio = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - meses, 1)).toISOString().slice(0, 10);

  const { data, error } = await s
    .from("movimentacoes")
    .select("valor, data")
    .eq("categoria_id", categoriaId)
    .eq("tipo", "despesa")
    .eq("status", "realizado")
    .gte("data", inicio);
  if (error) throw error;
  if (!data || data.length === 0) return 0;

  // Média por mês (não por lançamento) — meses sem nenhum gasto não entram na
  // conta, então a sugestão não fica artificialmente baixa.
  const porMes = new Map<string, number>();
  for (const m of data as any[]) {
    const chave = String(m.data).slice(0, 7);
    porMes.set(chave, (porMes.get(chave) || 0) + Number(m.valor));
  }
  const totais = [...porMes.values()];
  return totais.reduce((s, v) => s + v, 0) / totais.length;
}
