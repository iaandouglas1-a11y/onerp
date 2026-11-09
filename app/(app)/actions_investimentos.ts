"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

const invSchema = z.object({
  nome:       z.string().min(2, "Nome muito curto"),
  tipo:       z.enum(["renda_fixa", "renda_variavel"]),
  subcategoria: z.string().optional().or(z.literal("")).transform(v => v || null),
  ticker:     z.string().optional().or(z.literal("")).transform(v => v || null),
  conta_id:   z.string().uuid().optional().or(z.literal("")).transform(v => v || null),
  valor_atual: z.coerce.number().nonnegative("Valor inválido").default(0),
});

const movSchema = z.object({
  investimento_id: z.string().uuid("Investimento inválido"),
  tipo:            z.enum(["aporte", "resgate"]),
  valor:           z.coerce.number().positive("Valor deve ser maior que zero"),
  data:            z.string().min(10, "Data inválida"),
  descricao:       z.string().optional().or(z.literal("")).transform(v => v || null),
  conta_id:        z.string().uuid().optional().or(z.literal("")).transform(v => v || null),
});

function entries(f: FormData) { return Object.fromEntries(f.entries()); }

// ── Investimento CRUD ─────────────────────────────────────
export async function saveInvestimento(formData: FormData) {
  const id     = String(formData.get("id") || "");
  const parsed = invSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient();
  const result = id
    ? await (s.from("investimentos") as any).update(parsed.data).eq("id", id)
    : await (s.from("investimentos") as any).insert(parsed.data);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/investimentos");
}

export async function deleteInvestimento(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();
  const { error } = await (s.from("investimentos") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investimentos");
}

// ── Saldos mensais (evolução) ──────────────────────────────
const saldoMensalSchema = z.object({
  investimento_id: z.string().uuid("Investimento inválido"),
  mes:             z.string().min(7, "Mês inválido"), // formato yyyy-MM (input type="month")
  saldo:           z.coerce.number().nonnegative("Valor inválido"),
});

export async function saveSaldoMensal(formData: FormData) {
  const parsed = saldoMensalSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient();
  const mesCompleto = `${parsed.data.mes}-01`; // yyyy-MM -> yyyy-MM-01

  const { error } = await (s.from("investimento_saldos") as any)
    .upsert(
      {
        investimento_id: parsed.data.investimento_id,
        mes:             mesCompleto,
        saldo:           parsed.data.saldo,
      },
      { onConflict: "investimento_id,mes" }
    );
  if (error) throw new Error(error.message);

  // Atualiza também o valor_atual do investimento com o saldo informado
  await (s.from("investimentos") as any)
    .update({ valor_atual: parsed.data.saldo })
    .eq("id", parsed.data.investimento_id);

  revalidatePath("/investimentos");
}

export async function deleteSaldoMensal(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();
  const { error } = await (s.from("investimento_saldos") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investimentos");
}

export async function atualizarValorAtual(formData: FormData) {
  const id          = String(formData.get("id"));
  const valor_atual = Number(formData.get("valor_atual"));
  const s           = await createServerSupabaseClient();
  const { error }   = await (s.from("investimentos") as any).update({ valor_atual }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investimentos");
}

// ── Movimentos (aporte / resgate) ─────────────────────────
export async function saveMovimento(formData: FormData) {
  const parsed = movSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient();

  // Busca ou cria categoria "Investimento"
  let catId: string | null = null;
  const { data: existing } = await (s.from("categorias") as any)
    .select("id").eq("nome", "Investimento").limit(1).single();
  if (existing) {
    catId = existing.id;
  } else {
    const tipo = parsed.data.tipo === "aporte" ? "despesa" : "receita";
    const { data: nova } = await (s.from("categorias") as any)
      .insert({ nome: "Investimento", tipo }).select("id").single();
    catId = nova?.id || null;
  }

  // Cria movimentação automática se conta informada
  let movimentacao_id: string | null = null;
  if (parsed.data.conta_id && catId) {
    const { data: mov, error: movErr } = await (s.from("movimentacoes") as any)
      .insert({
        tipo:         parsed.data.tipo === "aporte" ? "despesa" : "receita",
        valor:        parsed.data.valor,
        data:         parsed.data.data,
        categoria_id: catId,
        conta_id:     parsed.data.conta_id,
        status:       "realizado",
        descricao:    parsed.data.descricao || `${parsed.data.tipo === "aporte" ? "Aporte" : "Resgate"} — ${parsed.data.investimento_id}`,
      })
      .select("id").single();
    if (movErr) throw new Error(movErr.message);
    movimentacao_id = mov?.id || null;
  }

  // Registra o movimento no investimento
  const { error } = await (s.from("investimento_movimentos") as any).insert({
    investimento_id: parsed.data.investimento_id,
    tipo:            parsed.data.tipo,
    valor:           parsed.data.valor,
    data:            parsed.data.data,
    descricao:       parsed.data.descricao,
    movimentacao_id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/investimentos");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}

export async function deleteMovimento(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();

  // Deleta movimentação vinculada
  const { data: mov } = await (s.from("investimento_movimentos") as any)
    .select("movimentacao_id").eq("id", id).single();
  if (mov?.movimentacao_id) {
    await (s.from("movimentacoes") as any).delete().eq("id", mov.movimentacao_id);
  }

  const { error } = await (s.from("investimento_movimentos") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/investimentos");
  revalidatePath("/movimentacoes");
}
