"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Plus } from "lucide-react"
import { FormGroup, Input, Select } from "@/components/ui"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = {
  onCreated?: () => void
}

export function FinancialQuickInline({ onCreated }: Props) {
  const [nome, setNome] = useState("")
  const [tipo, setTipo] = useState<"conta" | "cartao">("conta")
  const [limite, setLimite] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!nome) return

    setLoading(true)

    const id = crypto.randomUUID()
    const isCartao = tipo === "cartao"

    // 1. NOVO MODELO (sempre)
    const insertNovo = supabase
      .from("financeiro_itens")
      .insert({
        id,
        nome,
        tipo,
        logo_url: null,
        limite: isCartao ? limite : null,
        ativo: true
      })

    // 2. LEGACY (compatibilidade)
    const insertLegacy = isCartao
      ? supabase.from("cartoes").insert({
          id,
          nome,
          limite,
          conta_id: null,
          logo_url: null
        })
      : supabase.from("contas").insert({
          id,
          nome,
          tipo,
          logo_url: null
        })

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      insertNovo,
      insertLegacy
    ])

    setLoading(false)

    if (!e1 && !e2) {
      setNome("")
      setLimite(0)
      setTipo("conta")
      onCreated?.()
    } else {
      console.error("Erro dual write:", e1 || e2)
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <FormGroup label="Nome">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Nubank, Carteira..."
            className="text-sm"
          />
        </FormGroup>
        <FormGroup label="Tipo">
          <Select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "conta" | "cartao")}
            className="text-sm"
          >
            <option value="conta">Conta</option>
            <option value="cartao">Cartão</option>
          </Select>
        </FormGroup>
      </div>

      {tipo === "cartao" && (
        <FormGroup label="Limite">
          <Input
            type="number"
            step="0.01"
            value={limite}
            onChange={(e) => setLimite(Number(e.target.value))}
            placeholder="0,00"
            className="text-sm"
          />
        </FormGroup>
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200 disabled:opacity-60"
      >
        <Plus className="h-4 w-4" />
        {loading ? "Criando..." : "Criar"}
      </button>
    </div>
  )
}
