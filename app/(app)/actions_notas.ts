"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import type { NotaItem } from "@/types/database";

// ── Schemas ───────────────────────────────────────────────
const notaSchema = z.object({
  id: z.string().uuid("Nota inválida"),
  titulo: z.string().optional().or(z.literal("")),
  conteudo: z.string().optional().or(z.literal("")),
  itens: z.string().optional().or(z.literal("")), // JSON stringificado
});

function entries(f: FormData) { return Object.fromEntries(f.entries()); }

// Faz o parse defensivo do corpo da nota (vem como JSON stringificado do
// form) — descarta itens de checklist sem texto (não fazem sentido vazios),
// mas preserva blocos de texto vazios: são usados como linha em branco pra
// separar seções dentro da mesma nota. `tipo` ausente (notas salvas antes
// do modelo unificado) vira "item", que era o único tipo que existia antes.
function parseItens(raw?: string): NotaItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i) => i && typeof i.texto === "string" && (i.tipo === "texto" || i.texto.trim() !== ""))
      .map((i) => ({
        id: String(i.id),
        tipo: i.tipo === "texto" ? "texto" : "item",
        texto: i.tipo === "texto" ? String(i.texto) : String(i.texto).trim(),
        concluido: i.tipo === "texto" ? false : Boolean(i.concluido),
      }));
  } catch {
    return [];
  }
}

// ── Notas ─────────────────────────────────────────────────

// Cria uma nota vazia e já redireciona pra tela de edição dela —
// o botão "Nova nota" é só um form sem campos que chama esta action.
export async function criarNota() {
  const s = await createServerSupabaseClient();
  const { data, error } = await (s.from("notas") as any)
    .insert({ titulo: "", conteudo: "", itens: [], fixada: false, status: "ativa" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/notas", "layout");
  redirect(`/notas/${data.id}`);
}

export async function saveNota(formData: FormData) {
  const parsed = notaSchema.safeParse(entries(formData));
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const s = await createServerSupabaseClient();
  const { error } = await (s.from("notas") as any)
    .update({
      titulo: parsed.data.titulo || "",
      itens: parseItens(parsed.data.itens),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath("/notas", "layout");
  revalidatePath(`/notas/${parsed.data.id}`);
}

export async function deleteNota(formData: FormData) {
  const id = String(formData.get("id"));
  const s = await createServerSupabaseClient();
  const { error } = await (s.from("notas") as any).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/notas", "layout");
  redirect("/notas");
}

export async function togglePinNota(formData: FormData) {
  const id = String(formData.get("id"));
  const fixada = formData.get("fixada") === "true";
  const s = await createServerSupabaseClient();
  const { error } = await (s.from("notas") as any).update({ fixada: !fixada }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/notas", "layout");
  revalidatePath(`/notas/${id}`);
}

export async function arquivarNota(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) === "arquivada" ? "ativa" : "arquivada";
  const s = await createServerSupabaseClient();
  const { error } = await (s.from("notas") as any).update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/notas", "layout");
  redirect("/notas");
}
