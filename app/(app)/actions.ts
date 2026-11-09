"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import { ANTECIPACAO_FATURA_PREFIX, invoiceAnticipated, invoiceTotal } from "@/lib/finance";

// Schemas de Validação
const nullableId = z.string().uuid().optional().or(z.literal("")).transform((v) => v || null);

const movSchema = z.object({ 
  tipo: z.enum(["receita", "despesa"]), 
  valor: z.coerce.number().positive("O valor deve ser maior que zero"), 
  data: z.string().min(10, "Data inválida"), 
  categoria_id: z.string().uuid("Selecione uma categoria"), 
  conta_id: nullableId, 
  cartao_id: nullableId, 
  fatura_id: nullableId, 
  status: z.enum(["previsto", "realizado"]),
  descricao: z.string().optional().or(z.literal("")),
  parcelas_total: z.coerce.number().int().min(1).optional()
}).refine(
  (v) => v.tipo === "receita" 
    ? !!v.conta_id && !v.cartao_id 
    : !!v.conta_id || !!v.cartao_id, 
  "Receita precisa de conta; despesa precisa de conta ou cartão."
);

const contaSchema = z.object({ 
  nome: z.string().min(2, "Nome muito curto"), 
  tipo: z.enum(["corrente", "poupanca", "investimento", "dinheiro"]) 
});

const cartaoSchema = z.object({ 
  nome: z.string().min(2, "Nome muito curto"), 
  limite: z.coerce.number().nonnegative("Limite inválido"), 
  conta_id: z.string().uuid("Selecione a conta de pagamento") 
});

const faturaSchema = z.object({ 
  cartao_id: z.string().uuid("Selecione o cartão"), 
  data_fechamento: z.string().min(10, "Data de fechamento inválida"), 
  data_vencimento: z.string().min(10, "Data de vencimento inválida"),
  observacao: z.string().optional().or(z.literal("")).transform(v => v || null),
});

// ALTERADO: categoria agora inclui "tipo"
const categoriaSchema = z.object({
  nome: z.string().min(2, "Nome da categoria muito curto"),
  tipo: z.enum(["receita", "despesa"], {
    required_error: "Selecione o tipo da categoria"
  }),
  icone: z.string().min(1).max(60).optional().or(z.literal(""))
});

function entries(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

// --- Movimentações ---
export async function saveMovimentacao(formData: FormData) { 
  const id = String(formData.get("id") || ""); 
  const parsed = movSchema.safeParse(entries(formData)); 
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient();
  const { parcelas_total = 1, ...mov } = parsed.data;
  if (id || parcelas_total <= 1 || mov.tipo !== "despesa" || !mov.cartao_id) {
    const result = id
      ? await (s.from("movimentacoes") as any).update(mov).eq("id", id)
      : await (s.from("movimentacoes") as any).insert(mov);
    if (result.error) throw new Error(result.error.message);
  } else {
    if (!mov.fatura_id) throw new Error("Selecione a fatura da primeira parcela.");
    const { data: base, error: baseError } = await (s.from("faturas") as any)
      .select("id, cartao_id, data_vencimento, pago").eq("id", mov.fatura_id).single();
    if (baseError || !base || base.cartao_id !== mov.cartao_id) throw new Error("A fatura selecionada não pertence ao cartão.");
    if (base.pago) throw new Error("A fatura selecionada já está paga.");
    const valorParcela = Number((Number(mov.valor) / parcelas_total).toFixed(2));
    const diferenca = Number(mov.valor) - valorParcela * parcelas_total;
    for (let i = 0; i < parcelas_total; i++) {
      const venc = new Date(`${base.data_vencimento}T12:00:00`);
      venc.setMonth(venc.getMonth() + i);
      const dataVencimento = venc.toISOString().slice(0, 10);
      let faturaId = i === 0 ? base.id : null;
      if (!faturaId) {
        const { data: existente } = await (s.from("faturas") as any).select("id, pago").eq("cartao_id", mov.cartao_id).eq("data_vencimento", dataVencimento).maybeSingle();
        if (existente?.pago) throw new Error(`A fatura de ${dataVencimento} já está paga.`);
        if (existente) faturaId = existente.id;
        else {
          const fechamento = new Date(`${dataVencimento}T12:00:00`);
          fechamento.setDate(fechamento.getDate() - 7);
          const { data: nova, error: novaError } = await (s.from("faturas") as any).insert({ cartao_id: mov.cartao_id, data_fechamento: fechamento.toISOString().slice(0, 10), data_vencimento: dataVencimento, pago: false }).select("id").single();
          if (novaError) throw new Error(novaError.message);
          faturaId = nova.id;
        }
      }
      const valor = i === parcelas_total - 1 ? Number((valorParcela + diferenca).toFixed(2)) : valorParcela;
      const result = await (s.from("movimentacoes") as any).insert({ ...mov, valor, fatura_id: faturaId, descricao: `${mov.descricao || "Compra"} (parcela ${i + 1}/${parcelas_total})` });
      if (result.error) throw new Error(result.error.message);
    }
  }
  revalidatePath("/movimentacoes"); 
  revalidatePath("/dashboard"); 
  revalidatePath("/contas");
}

export async function duplicarMovimentacao(formData: FormData) {
  const id = String(formData.get("id"));
  const s  = await createServerSupabaseClient();
  const { data: orig, error } = await (s.from("movimentacoes") as any)
    .select("*").eq("id", id).single();
  if (error || !orig) throw new Error("Movimentação não encontrada.");

  const { data: nova, error: e2 } = await (s.from("movimentacoes") as any)
    .insert({
      tipo:         orig.tipo,
      valor:        orig.valor,
      data:         orig.data,
      categoria_id: orig.categoria_id,
      conta_id:     orig.conta_id,
      cartao_id:    orig.cartao_id,
      fatura_id:    orig.fatura_id,
      status:       orig.status,
      descricao:    orig.descricao ? `${orig.descricao} (cópia)` : "(cópia)",
    })
    .select("id").single();
  if (e2) throw new Error(e2.message);

  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
  revalidatePath("/contas");
}

export async function deleteMovimentacao(formData: FormData) { 
  const id = String(formData.get("id")); 
  const s = await createServerSupabaseClient(); 
  const { error } = await (s.from("movimentacoes") as any).delete().eq("id", id); 
  if (error) throw new Error(error.message); 
  revalidatePath("/movimentacoes"); 
  revalidatePath("/dashboard"); 
  revalidatePath("/contas");
}

// --- Contas ---
export async function saveConta(formData: FormData) { 
  const id = String(formData.get("id") || ""); 
  const parsed = contaSchema.safeParse(entries(formData)); 
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient(); 
  const result = id 
    ? await (s.from("contas") as any).update(parsed.data).eq("id", id) 
    : await (s.from("contas") as any).insert(parsed.data); 
  
  if (result.error) throw new Error(result.error.message); 
  revalidatePath("/contas"); 
}

// --- Cartões ---
export async function saveCartao(formData: FormData) { 
  const id = String(formData.get("id") || ""); 
  const parsed = cartaoSchema.safeParse(entries(formData)); 
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient(); 
  const result = id 
    ? await (s.from("cartoes") as any).update(parsed.data).eq("id", id) 
    : await (s.from("cartoes") as any).insert(parsed.data); 
  
  if (result.error) throw new Error(result.error.message); 
  revalidatePath("/contas/cartoes"); 
  revalidatePath("/contas"); 
}

// --- Faturas ---
export async function saveFatura(formData: FormData) { 
  const parsed = faturaSchema.safeParse(entries(formData)); 
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient(); 
  const { error } = await (s.from("faturas") as any).insert(parsed.data); 
  if (error) throw new Error(error.message); 
  revalidatePath("/faturas"); 
}

// --- Categorias ---
export async function saveCategoria(formData: FormData) {
  try {
    const parsed = categoriaSchema.safeParse(entries(formData));
    if (!parsed.success) throw new Error(parsed.error.errors[0].message);

    const s = await createServerSupabaseClient();

    const { error } = await (s.from("categorias") as any).insert({
      ...parsed.data,
      tipo: parsed.data.tipo, // garante envio explícito da nova coluna
    });

    if (error) {
      console.error("Erro Supabase:", error);
      throw new Error(`Erro no Banco de Dados: ${error.message}`);
    }

    revalidatePath("/categorias");
    revalidatePath("/movimentacoes");
  } catch (e: any) {
    console.error("Erro completo:", e);

    redirect(`/categorias?error=${encodeURIComponent(e.message)}`);
  }
}

export async function editCategoria(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Categoria inválida");
  const parsed = categoriaSchema.pick({ nome: true, icone: true }).safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);
  const s = await createServerSupabaseClient();
  const { error } = await (s.from("categorias") as any).update(parsed.data).eq("id", id);
  if (error) throw new Error(`Erro no Banco de Dados: ${error.message}`);
  revalidatePath("/categorias");
  revalidatePath("/movimentacoes");
}

export async function deleteCategoria(formData: FormData) {
  const id = String(formData.get("id"));

  const s = await createServerSupabaseClient();

  const { error } = await (s.from("categorias") as any)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(
      "Não é possível excluir categorias com movimentações vinculadas."
    );
  }

  revalidatePath("/categorias");
}

// --- Pagar Fatura ---
export async function pagarFatura(formData: FormData) {
  const fatura_id  = String(formData.get("fatura_id"));
  const conta_id   = String(formData.get("conta_id"));
  const cartao_id  = String(formData.get("cartao_id"));
  const total      = Number(formData.get("total"));
  const categoria_id = String(formData.get("categoria_id") || "");

  if (!fatura_id || !conta_id || !cartao_id || !total) {
    throw new Error("Dados insuficientes para pagar a fatura.");
  }

  const s = await createServerSupabaseClient();

  // 1. Buscar ou criar categoria "Fatura"
  let catId = categoria_id;
  if (!catId) {
    const { data: existing } = await (s.from("categorias") as any)
      .select("id").eq("nome", "Fatura").limit(1).single();
    if (existing) {
      catId = existing.id;
    } else {
      const { data: nova } = await (s.from("categorias") as any)
        .insert({ nome: "Fatura", tipo: "despesa" }).select("id").single();
      catId = nova?.id || null;
    }
  }

  // 2. Criar movimentação de pagamento da fatura
  // Não vincula fatura_id nem cartao_id para não dobrar o total/limite
  const { error: movError } = await (s.from("movimentacoes") as any).insert({
    tipo:         "despesa",
    valor:        total,
    data:         new Date().toISOString().slice(0, 10),
    categoria_id: catId,
    conta_id:     conta_id,
    cartao_id:    null,
    fatura_id:    null,
    status:       "realizado",
    descricao:    `Pagamento de fatura - ${cartao_id}`,
  });
  if (movError) throw new Error(movError.message);

  // 3. Marcar fatura como paga
  const { error: fatError } = await (s.from("faturas") as any)
    .update({
      pago: true,
      pago_em: new Date().toISOString(),
      conta_pagamento_id: conta_id,
    })
    .eq("id", fatura_id);
  if (fatError) throw new Error(fatError.message);

  revalidatePath("/faturas");
  revalidatePath("/contas/cartoes");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}

// --- Antecipar parte da fatura ---
export async function anteciparFatura(formData: FormData) {
  const fatura_id = String(formData.get("fatura_id") || "");
  const conta_id = String(formData.get("conta_id") || "");
  const valor = Number(formData.get("valor"));

  if (!fatura_id || !conta_id || !Number.isFinite(valor) || valor <= 0) {
    throw new Error("Informe uma conta e um valor válido para antecipar.");
  }

  const s = await createServerSupabaseClient();
  const [{ data: fatura, error: faturaError }, { data: movs, error: movsError }] = await Promise.all([
    (s.from("faturas") as any).select("id, cartao_id, pago").eq("id", fatura_id).single(),
    (s.from("movimentacoes") as any).select("fatura_id, tipo, valor, descricao").eq("fatura_id", fatura_id),
  ]);
  if (faturaError || !fatura) throw new Error("Fatura não encontrada.");
  if (movsError) throw new Error(movsError.message);
  if (fatura.pago) throw new Error("Esta fatura já foi paga.");

  const total = invoiceTotal(fatura_id, movs || []);
  const antecipado = invoiceAnticipated(fatura_id, movs || []);
  const restante = Math.max(0, total - antecipado);
  if (total <= 0) throw new Error("Esta fatura ainda não possui lançamentos.");
  if (valor > restante + 0.005) throw new Error(`O valor máximo para antecipar é R$ ${restante.toFixed(2).replace(".", ",")}.`);

  let catId: string | null = null;
  const { data: existing } = await (s.from("categorias") as any)
    .select("id").eq("nome", "Fatura").limit(1).single();
  if (existing) {
    catId = existing.id;
  } else {
    const { data: nova, error: catError } = await (s.from("categorias") as any)
      .insert({ nome: "Fatura", tipo: "despesa" }).select("id").single();
    if (catError) throw new Error(catError.message);
    catId = nova?.id || null;
  }
  if (!catId) throw new Error("Não foi possível preparar a categoria da antecipação.");

  const { error } = await (s.from("movimentacoes") as any).insert({
    tipo: "despesa",
    valor,
    data: new Date().toISOString().slice(0, 10),
    categoria_id: catId,
    conta_id,
    cartao_id: null,
    fatura_id,
    status: "realizado",
    descricao: `${ANTECIPACAO_FATURA_PREFIX} ${fatura.cartao_id}`,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/faturas");
  revalidatePath("/contas");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}

// --- Cancelar Pagamento de Fatura ---
export async function cancelarPagamentoFatura(formData: FormData) {
  const fatura_id  = String(formData.get("fatura_id"));
  const movimentacao_id = String(formData.get("movimentacao_id") || "");

  const s = await createServerSupabaseClient();

  // 1. Deletar a movimentação de pagamento
  // Busca pela descricao que inclui o cartao_id (sem fatura_id pois não vinculamos)
  const { data: faturaData } = await (s.from("faturas") as any)
    .select("cartao_id, conta_pagamento_id")
    .eq("id", fatura_id)
    .single();

  if (movimentacao_id) {
    await (s.from("movimentacoes") as any).delete().eq("id", movimentacao_id);
  } else if (faturaData) {
    await (s.from("movimentacoes") as any)
      .delete()
      .eq("conta_id", faturaData.conta_pagamento_id)
      .eq("descricao", `Pagamento de fatura - ${faturaData.cartao_id}`)
      .eq("status", "realizado");
  }

  // 2. Reverter fatura para não paga
  const { error } = await (s.from("faturas") as any)
    .update({ pago: false, pago_em: null, conta_pagamento_id: null })
    .eq("id", fatura_id);
  if (error) throw new Error(error.message);

  revalidatePath("/faturas");
  revalidatePath("/contas/cartoes");
  revalidatePath("/movimentacoes");
  revalidatePath("/dashboard");
}

// --- Transferência entre Contas ---
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

  // Busca ou cria categoria "Transferência"
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

  // Saída da conta origem
  const { error: e1 } = await (s.from("movimentacoes") as any).insert({
    tipo: "despesa", valor, data,
    categoria_id: catId,
    conta_id: conta_origem_id,
    status: "realizado",
    descricao: `${descricao} (saída)`,
  });
  if (e1) throw new Error(e1.message);

  // Entrada na conta destino
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
