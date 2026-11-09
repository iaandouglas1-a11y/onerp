"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import { getMediaGastoCategoria } from "@/lib/queries";

function entries(f: FormData) { return Object.fromEntries(f.entries()); }

// ── Itens (receita/despesa fixo ou variável) ───────────────
// `dia_referencia` é obrigatório em todo lançamento (mesmo nos de data
// variável, como Honorários) — é o que decide em qual quinzena o item entra:
// dias 1-14 → Quinzena 1, dias 15-31 → Quinzena 2 (corte fixo em 15).
const itemSchema = z.object({
  competencia:     z.string().min(7, "Competência inválida"), // yyyy-MM
  tipo:            z.enum(["receita", "despesa"]),
  subtipo:         z.enum(["fixo", "variavel"]),
  categoria_id:    z.string().uuid().optional().or(z.literal("")).transform(v => v || null),
  descricao:       z.string().min(2, "Descrição muito curta"),
  valor:           z.coerce.number().positive("Valor deve ser maior que zero"),
  dia_referencia:  z.coerce.number().int().min(1, "Informe um dia entre 1 e 31").max(31, "Informe um dia entre 1 e 31"),
});

export async function saveOrcamentoItem(formData: FormData) {
  const id     = String(formData.get("id") || "");
  const parsed = itemSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const payload = { ...parsed.data, competencia: `${parsed.data.competencia.slice(0, 7)}-01` };

  const s = await createServerSupabaseClient();
  const result = id
    ? await (s.from("orcamento_itens") as any).update(payload).eq("id", id)
    : await (s.from("orcamento_itens") as any).insert(payload);
  if (result.error) throw new Error(result.error.message);

  revalidatePath("/orcamento");
}

export async function deleteOrcamentoItem(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();
  const { error } = await (s.from("orcamento_itens") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/orcamento");
}

// ── Compras parceladas ──────────────────────────────────────
const parcelaSchema = z.object({
  descricao:             z.string().min(2, "Descrição muito curta"),
  categoria_id:          z.string().uuid().optional().or(z.literal("")).transform(v => v || null),
  valor_parcela:         z.coerce.number().positive("Valor deve ser maior que zero"),
  parcelas_total:        z.coerce.number().int().positive("Informe o número de parcelas"),
  data_primeira_parcela: z.string().min(7, "Mês inválido"), // yyyy-MM
  dia_referencia:        z.coerce.number().int().min(1, "Informe um dia entre 1 e 31").max(31, "Informe um dia entre 1 e 31"),
});

export async function saveOrcamentoParcela(formData: FormData) {
  const id     = String(formData.get("id") || "");
  const parsed = parcelaSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const payload = {
    ...parsed.data,
    data_primeira_parcela: `${parsed.data.data_primeira_parcela.slice(0, 7)}-01`,
  };

  const s = await createServerSupabaseClient();
  const result = id
    ? await (s.from("orcamento_parcelas") as any).update(payload).eq("id", id)
    : await (s.from("orcamento_parcelas") as any).insert(payload);
  if (result.error) throw new Error(result.error.message);

  revalidatePath("/orcamento");
}

export async function deleteOrcamentoParcela(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();
  const { error } = await (s.from("orcamento_parcelas") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/orcamento");
}

// ── Duplicar orçamento ──────────────────────────────────────
// Copia os itens (receitas + despesas fixas/variáveis, com o mesmo
// dia_referencia) de uma competência para a seguinte. Parcelas não entram na
// cópia de propósito: elas são calculadas a partir de data_primeira_parcela +
// parcelas_total (ver parcelaInfoParaMes em lib/queries.ts) e continuam
// aparecendo sozinhas enquanto estiverem dentro do período — duplicá-las
// criaria parcelas soltas, desalinhadas da original.
export async function duplicarOrcamento(formData: FormData) {
  const competenciaAtual = String(formData.get("competencia"));
  const inicioAtual = `${competenciaAtual.slice(0, 7)}-01`;
  const [ano, mes] = inicioAtual.split("-").map(Number);
  // `mes` vem no formato humano (1-12); usado direto como índice zero-based do
  // Date.UTC, o resultado é automaticamente o mês seguinte (e vira o ano em dez).
  const proximaCompetencia = new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 10);

  const s = await createServerSupabaseClient();

  const { data: existentes, error: eCheck } = await (s.from("orcamento_itens") as any)
    .select("id").eq("competencia", proximaCompetencia).limit(1);
  if (eCheck) throw new Error(eCheck.message);
  if (existentes && existentes.length > 0) {
    throw new Error("Já existe um orçamento lançado para o próximo mês.");
  }

  const { data: itensAtuais, error } = await (s.from("orcamento_itens") as any)
    .select("tipo,subtipo,categoria_id,descricao,valor,dia_referencia")
    .eq("competencia", inicioAtual);
  if (error) throw new Error(error.message);
  if (!itensAtuais || itensAtuais.length === 0) {
    throw new Error("Não há itens neste mês para duplicar.");
  }

  const novos = itensAtuais.map((i: any) => ({ ...i, competencia: proximaCompetencia }));
  const { error: eInsert } = await (s.from("orcamento_itens") as any).insert(novos);
  if (eInsert) throw new Error(eInsert.message);

  revalidatePath("/orcamento");
}

// ── Sugestão de valor (custos variáveis) ────────────────────
// Chamada direto do client (não via form action) ao escolher a categoria.
export async function sugerirValorCategoria(categoriaId: string): Promise<number> {
  if (!categoriaId) return 0;
  return getMediaGastoCategoria(categoriaId, 3);
}
