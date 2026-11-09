"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabaseClient";

export async function duplicarMovimentacao(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();
  const { data: orig, error } = await (s.from("movimentacoes") as any)
    .select("*").eq("id", id).single();
  if (error || !orig) throw new Error("Movimentação não encontrada.");

  const { error: e2 } = await (s.from("movimentacoes") as any).insert({
    tipo:         orig.tipo,
    valor:        orig.valor,
    data:         orig.data,
    categoria_id: orig.categoria_id,
    conta_id:     orig.conta_id,
    cartao_id:    orig.cartao_id,
    fatura_id:    orig.fatura_id,
    status:       orig.status,
    descricao:    orig.descricao ? `${orig.descricao} (cópia)` : "(cópia)",
  });
  if (e2) throw new Error(e2.message);

  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}
