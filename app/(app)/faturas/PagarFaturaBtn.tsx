"use client";

import { useState } from "react";
import { CheckCircle, CreditCard, X, RotateCcw } from "lucide-react";
import { pagarFatura, cancelarPagamentoFatura } from "@/app/(app)/actions";
import { currency, dateBR } from "@/lib/format";

interface Props {
  faturaId:  string;
  cartaoId:  string;
  total:     number;
  pago:      boolean;
  pagoEm:    string | null;
  contas:    { id: string; nome: string }[];
}

export default function PagarFaturaBtn({ faturaId, cartaoId, total, pago, pagoEm, contas }: Props) {
  const [aberto, setAberto] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(contas[0]?.id ?? "");

  // --- Fatura já paga ---
  if (pago) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#5DA832]/10 border border-[#5DA832]/30 text-[#5DA832] text-sm font-semibold">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>Fatura paga</span>
          {pagoEm && (
            <span className="text-[#5DA832]/60 font-normal text-xs">
              em {dateBR(pagoEm.slice(0, 10))}
            </span>
          )}
        </div>

        {/* Cancelar baixa */}
        {!cancelando ? (
          <button
            type="button"
            onClick={() => setCancelando(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all duration-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Cancelar baixa
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141414] border border-amber-500/40">
            <span className="text-xs text-amber-400 px-2">Confirmar cancelamento?</span>
            <form action={cancelarPagamentoFatura}>
              <input type="hidden" name="fatura_id" value={faturaId} />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold transition-all duration-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Sim, cancelar
              </button>
            </form>
            <button
              type="button"
              onClick={() => setCancelando(false)}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-xl transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Fatura não paga ---
  return (
    <div className="relative w-full">
      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="w-full min-h-10 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-sm font-semibold transition-all duration-200 active:scale-95"
        >
          <CreditCard className="h-4 w-4" />
          Pagar Fatura
        </button>
      ) : (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141414] border border-[#5DA832]/40">
          <select
            value={contaSelecionada}
            onChange={(e) => setContaSelecionada(e.target.value)}
            className="select-modern h-11 text-sm flex-1 min-w-0"
          >
            {contas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <form action={pagarFatura}>
            <input type="hidden" name="fatura_id" value={faturaId} />
            <input type="hidden" name="cartao_id" value={cartaoId} />
            <input type="hidden" name="conta_id"  value={contaSelecionada} />
            <input type="hidden" name="total"     value={total} />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-xs font-semibold transition-all duration-200 whitespace-nowrap"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Confirmar {currency(total)}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setAberto(false)}
            className="p-2 text-slate-500 hover:text-slate-300 rounded-xl transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
