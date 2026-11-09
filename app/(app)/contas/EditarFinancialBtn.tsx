"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { toast } from "sonner"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Item = {
  id: string
  nome: string
  tipo: "conta" | "cartao"
  limite?: number
}

type Props = {
  item: Item
}

export function EditarFinancialBtn({ item }: Props) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(item.nome)
  const [limite, setLimite] = useState(item.limite || 0)
  const [loading, setLoading] = useState(false)

async function handleSave() {
  setLoading(true)

  const updatesNovo =
    item.tipo === "cartao"
      ? { nome, limite }
      : { nome }

  const updateNovo = supabase
    .from("financeiro_itens")
    .update(updatesNovo)
    .eq("id", item.id)

  const updateLegacy =
    item.tipo === "cartao"
      ? supabase.from("cartoes").update({
          nome,
          limite
        }).eq("id", item.id)
      : supabase.from("contas").update({
          nome
        }).eq("id", item.id)

  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    updateNovo,
    updateLegacy
  ])

  setLoading(false)

  if (!e1 && !e2) {
    setOpen(false)
    toast.success("Alterações salvas com sucesso")
  } else {
    console.error("Erro update dual:", e1 || e2)
  }
}
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-white/60 text-sm"
      >
        Editar
      </button>
    )
  }

  return (
    <div className="space-y-2">

      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="bg-transparent text-white text-sm outline-none border-b border-white/20"
      />

      {item.tipo === "cartao" && (
        <input
          type="number"
          value={limite}
          onChange={(e) => setLimite(Number(e.target.value))}
          className="bg-transparent text-white text-sm outline-none border-b border-white/20"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="text-white/40 text-xs"
        >
          Cancelar
        </button>

        <button
          onClick={handleSave}
          disabled={loading}
          className="text-green-400 text-xs"
        >
          {loading ? "..." : "Salvar"}
        </button>
      </div>
    </div>
  )
}
