import { FinancialItem } from "@/lib/financeiro";

type Props = {
  item: FinancialItem;
};

export function FinancialRow({ item }: Props) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10" />

        <div>
          <p className="text-sm font-medium text-white">
            {item.nome}
          </p>

          <p className="text-xs text-white/50">
            {item.tipo === "conta" ? "Conta" : "Cartão"}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-white">
          {/* placeholder por enquanto */}
          R$ 0,00
        </p>
      </div>
    </div>
  );
}
