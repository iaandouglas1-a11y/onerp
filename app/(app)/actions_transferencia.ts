"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

export async function realizarTransferencia(formData: FormData) {
  const conta_origem_id  = String(formData.get("conta_origem_id"));
  const conta_destino_id = String(formData.get("conta_destino_id"));
  const valor            = Number(formData.get("valor"));
  const data             = String(formData.get("data"));
  const descricao        = String(formData.get("descricao") || "Transferência entre contas");

  if (!conta_origem_id || !conta_destino_id || !valor || !data)
    throw new Error("Preencha todos os campos obrigatórios.");

  if (conta_origem_id === conta_destino_id)
    throw new Error("Conta de origem e destino não podem ser iguais.");

  const s = await createServerSupabaseClient();

  let catId: string | null = null;
  const { data: existing } = await (s.from("categorias") as any)
    .select("id").eq("nome", "Transferência").limit(1).single();
  if (existing) {
    catId = existing.id;
  } else {
    const { data: nova } = await (s.from("categorias") as any)
      .insert({ nome: "Transferência", tipo: "despesa" }).select("id").single();
    catId = nova?.id || null;
  }

  const { error: e1 } = await (s.from("movimentacoes") as any).insert({
    tipo: "despesa", valor, data,
    categoria_id: catId,
    conta_id: conta_origem_id,
    status: "realizado",
    descricao: `${descricao} (saída)`,
  });
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await (s.from("movimentacoes") as any).insert({
    tipo: "receita", valor, data,
    categoria_id: catId,
    conta_id: conta_destino_id,
    status: "realizado",
    descricao: `${descricao} (entrada)`,
  });
  if (e2) throw new Error(e2.message);

  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}
