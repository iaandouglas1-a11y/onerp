"use client";

import { useState } from "react";
import { Receipt, ChevronDown, ChevronUp } from "lucide-react";
import { currency, dateBR } from "@/lib/format";
import PagarFaturaBtn from "./PagarFaturaBtn";
import AnteciparFaturaBtn from "./AnteciparFaturaBtn";
import EditarExpenseBtn from "./EditarExpenseBtn";

type Props = {
  faturaId: string;
  cartaoId: string;
  cartaoNome: string;
  cartaoLogo?: string | null;
  dataFechamento: string;
  dataVencimento: string;
  pago: boolean;
  pagoEm?: string | null;
  observacao?: string | null;
  total: number;
  antecipado: number;
  restante: number;
  isOverdue: boolean;
  isDue: boolean;
  expenses: any[];
  contas:     { id: string; nome: string }[];
  categorias: { id: string; nome: string }[];
  cartoes:    { id: string; nome: string }[];
  faturas:    { id: string; data_vencimento: string }[];
};

export default function FaturaAccordion({
  faturaId,
  cartaoId,
  cartaoNome,
  cartaoLogo,
  dataFechamento,
  dataVencimento,
  pago,
  pagoEm,
  observacao,
  total,
  antecipado,
  restante,
  isOverdue,
  isDue,
  expenses,
  contas,
  categorias,
  cartoes,
  faturas,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-surface-border/60 bg-surface-2/40 overflow-hidden">

      {/* HEADER */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-2/40 transition"
      >
        <div className="flex items-center gap-4">

          {/* LOGO OU ÍCONE */}
          <div className={`h-10 w-10 rounded-xl overflow-hidden ${
            cartaoLogo
              ? ""
              : "bg-gradient-to-br from-[#5DA832]/30 to-[#5DA832]/10 flex items-center justify-center"
          }`}>
            {cartaoLogo ? (
              <img src={cartaoLogo} alt={cartaoNome} className="h-full w-full object-cover" />
            ) : (
              <Receipt className="h-5 w-5 text-[#5DA832]" />
            )}
          </div>

          {/* INFO */}
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-200">{cartaoNome}</p>
            <p className="text-xs text-slate-500">
              Fechamento: {dateBR(dataFechamento)} • Vencimento: {dateBR(dataVencimento)}
            </p>
          </div>
        </div>

        {/* STATUS + VALOR */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-sm font-semibold ${
              pago ? "text-emerald-400"
              : isOverdue ? "text-rose-400"
              : isDue ? "text-amber-400"
              : "text-slate-200"
            }`}>
              {currency(restante)}
            </p>
            <p className="text-xs text-slate-500">
              {pago ? "Pago" : antecipado > 0 ? "Saldo restante" : isOverdue ? "Atrasado" : isDue ? "A vencer" : "Aberto"}
            </p>
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </button>

      {/* BODY */}
      {open && (
        <div className="px-5 pb-5 border-t border-surface-border/40 space-y-4 pt-4">

          {/* OBSERVAÇÃO */}
          {observacao && (
            <p className="text-sm text-slate-400 italic">{observacao}</p>
          )}

          {/* AÇÕES DA FATURA */}
          <div className="grid grid-cols-2 gap-2 items-start">
          <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
            <PagarFaturaBtn
              faturaId={faturaId}
              cartaoId={cartaoId}
              total={restante}
              pago={pago}
              pagoEm={pagoEm ?? null}
              contas={contas}
            />
          </div>
          {!pago && (
            <div className="min-w-0" onClick={(e) => e.stopPropagation()}>
              <AnteciparFaturaBtn
                faturaId={faturaId}
                total={total}
                antecipado={antecipado}
                restante={restante}
                contas={contas}
              />
            </div>
          )}
          </div>

          {/* LISTA DE DESPESAS */}
          {expenses.length === 0 ? (
            <p className="text-sm text-slate-600 italic">Nenhuma movimentação nesta fatura.</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_auto] text-[11px] font-semibold text-slate-600 pb-1 border-b border-surface-border/40 px-1">
                <span>Descrição</span>
                <span className="text-right">Valor</span>
              </div>
              {expenses.map((exp) => (
                <div key={exp.id} className="group/exp">
                  <div className="grid grid-cols-[1fr_auto_auto] items-center text-sm bg-surface-2/40 px-3 py-2 rounded-md gap-3">
                    <div className="min-w-0">
                      <p className="text-slate-300 truncate">{exp.categorias?.nome ?? "Despesa"}</p>
                      {exp.descricao && <p className="text-xs text-slate-500 truncate">{exp.descricao}</p>}
                    </div>
                    <span className="text-slate-200 font-semibold whitespace-nowrap">{currency(Number(exp.valor))}</span>
                    <EditarExpenseBtn
                      exp={exp}
                      categorias={categorias}
                      contas={contas}
                      cartoes={cartoes}
                      faturas={faturas}
                    />
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-surface-border/40 px-1 mt-1">
                <span className="text-slate-400">Total</span>
                <span className="text-white">{currency(total)}</span>
              </div>
              {antecipado > 0 && (
                <div className="flex justify-between text-xs px-1 mt-1">
                  <span className="text-slate-500">Saldo após antecipação</span>
                  <span className="text-[#8FCB5E] font-semibold">{currency(restante)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
