import {
  getFinancialItems,
  getMovimentacoes,
  getFaturas,
} from "@/lib/datafinance";

import type { Movimentacao } from "@/types/database";
import { invoiceRemaining } from "@/lib/finance";

type EnrichedFinancialItem = {
  id: string;
  nome: string;
  tipo: "conta" | "cartao";
  logo_url?: string;
  ativo: boolean;

  // métricas calculadas
  saldo: number;
  limite?: number;
  usado?: number;
  disponivel?: number;
};

function signedValue(mov: Movimentacao) {
  return mov.tipo === "receita"
    ? Number(mov.valor)
    : -Number(mov.valor);
}

function calcContaSaldo(contaId: string, movs: Movimentacao[]) {
  return movs
    .filter((m) => m.conta_id === contaId && m.status === "realizado")
    .reduce((sum, m) => sum + signedValue(m), 0);
}

// "Usado" do cartão = soma das faturas ainda não pagas (mesmo critério do
// card "Faturas em aberto" do Dashboard). Faturas já pagas não entram mais,
// então o valor não fica crescendo pra sempre depois do pagamento.
function calcCartaoUsado(cartaoId: string, faturas: any[], movs: Movimentacao[]) {
  return faturas
    .filter((f) => f.cartao_id === cartaoId && !f.pago)
    .reduce((sum, f) => sum + invoiceRemaining(f.id, movs), 0);
}

export async function getFinancialOverview(): Promise<
  EnrichedFinancialItem[]
> {
  const [items, movs, faturas] = await Promise.all([
    getFinancialItems(),
    getMovimentacoes(),
    getFaturas(),
  ]);

  const enriched: EnrichedFinancialItem[] = items.map((item: any) => {
    if (item.tipo === "conta") {
      const saldo = calcContaSaldo(item.id, movs);

      return {
        id: item.id,
        nome: item.nome,
        tipo: "conta",
        logo_url: item.logo_url,
        ativo: item.ativo !== false,
        saldo,
      };
    }

    if (item.tipo === "cartao") {
      const usado = calcCartaoUsado(item.id, faturas, movs);
      const limite = Number(item.limite || 0);

      return {
        id: item.id,
        nome: item.nome,
        tipo: "cartao",
        logo_url: item.logo_url,
        ativo: item.ativo !== false,

        saldo: -usado,
        limite,
        usado,
        disponivel: limite - usado,
      };
    }

    return item;
  });

  return enriched;
}
