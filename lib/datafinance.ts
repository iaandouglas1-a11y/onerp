import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getFinancialItems() {
  const { data, error } = await supabase
    .from("financeiro_itens")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getMovimentacoes() {
  const { data, error } = await supabase
    .from("movimentacoes")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getFaturas() {
  const { data, error } = await supabase
    .from("faturas")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}
