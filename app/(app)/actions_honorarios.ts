"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

function entries(f: FormData) { return Object.fromEntries(f.entries()); }

const honorarioSchema = z.object({
  cliente_id:  z.string().uuid("Cliente inválido"),
  competencia: z.string().min(7, "Competência inválida"), // yyyy-MM (input type="month")
  valor:       z.coerce.number().nonnegative("Valor inválido"),
  vencimento:  z.string().min(10, "Vencimento inválido"),
  observacao:  z.string().optional().or(z.literal("")).transform(v => v || null),
});

// ── CRUD honorário ──────────────────────────────────────────
export async function saveHonorario(formData: FormData) {
  const id     = String(formData.get("id") || "");
  const parsed = honorarioSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient();
  if (!id) {
    const { data: cliente, error: clienteError } = await (s.from("clientes") as any)
      .select("id, ativo")
      .eq("id", parsed.data.cliente_id)
      .maybeSingle();
    if (clienteError) throw new Error(clienteError.message);
    if (!cliente || cliente.ativo === false) {
      throw new Error("Só é possível lançar honorários para clientes ativos.");
    }
  }

  const payload = {
    cliente_id:  parsed.data.cliente_id,
    competencia: `${parsed.data.competencia}-01`, // yyyy-MM -> yyyy-MM-01
    valor:       parsed.data.valor,
    vencimento:  parsed.data.vencimento,
    observacao:  parsed.data.observacao,
  };

  const result = id
    ? await (s.from("honorarios") as any).update(payload).eq("id", id)
    : await (s.from("honorarios") as any).insert(payload);
  if (result.error) throw new Error(result.error.message);

  revalidatePath("/honorarios");
  revalidatePath("/gestao-pj");
}

export async function deleteHonorario(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();

  // Remove a movimentação de recebimento vinculada, se houver
  const { data: hon } = await (s.from("honorarios") as any)
    .select("movimentacao_id").eq("id", id).single();
  if (hon?.movimentacao_id) {
    await (s.from("movimentacoes") as any).delete().eq("id", hon.movimentacao_id);
  }

  const { error } = await (s.from("honorarios") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/honorarios");
  revalidatePath("/gestao-pj");
  revalidatePath("/movimentacoes");
}

// ── Baixa de pagamento ───────────────────────────────────────
export async function marcarHonorarioPago(formData: FormData) {
  const id       = String(formData.get("id"));
  const contaId  = String(formData.get("conta_id") || "") || null;
  const valor    = Number(formData.get("valor"));
  const clienteNome = String(formData.get("cliente_nome") || "");
  const dataPagamento = String(formData.get("data_pagamento") || "") || new Date().toISOString().slice(0, 10);

  const s = await createServerSupabaseClient();

  let movimentacao_id: string | null = null;

  if (contaId) {
    // Busca ou cria categoria "Honorários"
    let catId: string | null = null;
    const { data: existing } = await (s.from("categorias") as any)
      .select("id").eq("nome", "Honorários").limit(1).single();
    if (existing) {
      catId = existing.id;
    } else {
      const { data: nova } = await (s.from("categorias") as any)
        .insert({ nome: "Honorários", tipo: "receita" }).select("id").single();
      catId = nova?.id || null;
    }

    if (catId) {
      const { data: mov, error: movErr } = await (s.from("movimentacoes") as any)
        .insert({
          tipo:         "receita",
          valor,
          data:         dataPagamento,
          categoria_id: catId,
          conta_id:     contaId,
          status:       "realizado",
          descricao:    `Honorário — ${clienteNome}`,
        })
        .select("id").single();
      if (movErr) throw new Error(movErr.message);
      movimentacao_id = mov?.id || null;
    }
  }

  const { error } = await (s.from("honorarios") as any)
    .update({
      pago:            true,
      pago_em:         dataPagamento,
      conta_id:        contaId,
      movimentacao_id,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/honorarios");
  revalidatePath("/gestao-pj");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}

export async function cancelarPagamentoHonorario(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();

  const { data: hon } = await (s.from("honorarios") as any)
    .select("movimentacao_id").eq("id", id).single();
  if (hon?.movimentacao_id) {
    await (s.from("movimentacoes") as any).delete().eq("id", hon.movimentacao_id);
  }

  const { error } = await (s.from("honorarios") as any)
    .update({ pago: false, pago_em: null, conta_id: null, movimentacao_id: null })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/honorarios");
  revalidatePath("/gestao-pj");
  revalidatePath("/movimentacoes");
}
