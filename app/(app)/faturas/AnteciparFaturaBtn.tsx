"use client";

import { useState } from "react";
import { CheckCircle, Coins, X } from "lucide-react";
import { anteciparFatura } from "@/app/(app)/actions";
import { currency } from "@/lib/format";

type Props = {
  faturaId: string;
  total: number;
  antecipado: number;
  restante: number;
  contas: { id: string; nome: string }[];
};

export default function AnteciparFaturaBtn({ faturaId, total, antecipado, restante, contas }: Props) {
  const [aberto, setAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(contas[0]?.id ?? "");

  if (restante <= 0) return null;

  return (
    <div className="relative w-full space-y-2">
      {antecipado > 0 && (
        <div className="text-xs text-slate-500">
          Antecipado: <span className="text-[#8FCB5E] font-semibold">{currency(antecipado)}</span>
          <span className="mx-1.5 text-slate-700">•</span>
          Restante: <span className="text-slate-300 font-semibold">{currency(restante)}</span>
        </div>
      )}
      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="w-full min-h-10 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface border border-surface-border/60 hover:border-[#5DA832]/50 hover:text-[#8FCB5E] text-ink-secondary text-sm font-semibold transition-all duration-200 active:scale-95"
        >
          <Coins className="h-4 w-4" />
          Antecipar parte
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-[#141414] border border-[#5DA832]/40 space-y-2">
          <p className="text-xs text-ink-secondary">Antecipar até {currency(restante)} da fatura de {currency(total)}</p>
          <form action={anteciparFatura} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input type="hidden" name="fatura_id" value={faturaId} />
            <select
              name="conta_id"
              value={contaSelecionada}
              onChange={(e) => setContaSelecionada(e.target.value)}
              className="select-modern h-11 text-sm flex-1 min-w-0"
              required
            >
              <option value="">Conta de pagamento</option>
              {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span>
              <input
                name="valor"
                type="number"
                min="0.01"
                max={restante.toFixed(2)}
                step="0.01"
                placeholder="Valor"
                required
                className="input-modern h-11 pl-8 text-sm font-semibold"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-xs font-semibold transition-all duration-200 whitespace-nowrap"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="p-2 text-slate-500 hover:text-slate-300 rounded-xl transition-colors self-center"
              aria-label="Cancelar antecipação"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
