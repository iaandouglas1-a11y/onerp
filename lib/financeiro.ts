import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type FinancialItem = {
  id: string
  nome: string
  tipo: "conta" | "cartao"
  logo_url?: string
  limite?: number
  conta_id?: string
}

//
// 🔵 LEITURA UNIFICADA (NOVA FONTE)
//
export async function getFinancialItems() {
  const { data, error } = await supabase
    .from("financeiro_itens")
    .select("*")

  if (error) {
    console.error("getFinancialItems error:", error)
    return []
  }

  return data as FinancialItem[]
}

//
// 🟡 LEITURA LEGACY (mantém sistema atual funcionando)
//
export async function getContasLegacy() {
  const { data, error } = await supabase
    .from("contas")
    .select("*")

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function getCartoesLegacy() {
  const { data, error } = await supabase
    .from("cartoes")
    .select("*")

  if (error) {
    console.error(error)
    return []
  }

  return data
}
