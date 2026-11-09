"use client";

import { RotateCcw } from "lucide-react";
import { desfazerPagamento } from "@/app/(app)/actions_dividas";
import { useState } from "react";

interface Props {
  pagamentoId: string;
  tipo: "orcado" | "realizado";
}

export default function DesfazerPagamentoBtn({ pagamentoId, tipo }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [loading, setLoading] = useState(false);

  if (confirmando) {
    return (
      <form
        action={async (formData) => {
          setLoading(true);
          await desfazerPagamento(formData);
          setLoading(false);
          setConfirmando(false);
        }}
        className="inline-flex items-center gap-1 animate-in fade-in duration-200"
      >
        <input type="hidden" name="id" value={pagamentoId} />
        <button
          type="submit"
          disabled={loading}
          className="text-[11px] px-2 py-0.5 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors font-semibold disabled:opacity-50"
        >
          {loading ? "..." : "Confirmar"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => setConfirmando(false)}
          className="text-[11px] px-2 py-0.5 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          Não
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
      title={tipo === "realizado" ? "Voltar para orçado" : "Remover orçado"}
    >
      <RotateCcw className="h-3.5 w-3.5" />
    </button>
  );
}
