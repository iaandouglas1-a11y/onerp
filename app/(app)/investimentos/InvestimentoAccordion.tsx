"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { currency, dateBR } from "@/lib/format";
import { deleteMovimento, deleteInvestimento, atualizarValorAtual } from "@/app/(app)/actions_investimentos";
import { IconChip, Badge } from "@/components/ui";
import type { InvestimentoMovimento } from "@/types/database";

interface Props {
  id:          string;
  nome:        string;
  tipo:        "renda_fixa" | "renda_variavel";
  subcategoria: string | null;
  ticker:      string | null;
  contaNome:   string | null;
  valorAtual:  number;
  movimentos:  InvestimentoMovimento[];
}

export default function InvestimentoAccordion({ id, nome, tipo, subcategoria, ticker, contaNome, valorAtual, movimentos }: Props) {
  const [open, setOpen]           = useState(false);
  const [editando, setEditando]   = useState(false);
  const [novoValor, setNovoValor] = useState(String(valorAtual));

  const totalAportado = movimentos
    .filter(m => m.tipo === "aporte")
    .reduce((s, m) => s + Number(m.valor), 0);
  const totalResgatado = movimentos
    .filter(m => m.tipo === "resgate")
    .reduce((s, m) => s + Number(m.valor), 0);
  const valorInvestido = totalAportado - totalResgatado;
  const rentabilidade  = valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0;
  const positivo       = rentabilidade >= 0;

  return (
    <div className="rounded-xl border border-surface-border/60 bg-surface/60 overflow-hidden">

      {/* HEADER — div (não button) pra poder aninhar o botão de excluir sem <button> dentro de <button> */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen(v => !v); }}
        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-surface-2/30 transition text-left cursor-pointer"
      >
        <IconChip
          icon={tipo === "renda_fixa" ? TrendingUp : TrendingUp}
          tone={tipo === "renda_fixa" ? "blue" : "green"}
          size={38}
          iconSize={17}
        />

        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink-primary truncate">{nome}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <Badge variant={tipo === "renda_fixa" ? "info" : "success"} className="text-[11px]">
              {subcategoria || (tipo === "renda_fixa" ? "Renda Fixa" : "Renda Variável")}
            </Badge>
            {ticker && <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-2 text-slate-400 font-mono">{ticker}</span>}
            {contaNome && <span className="text-[11px] text-ink-tertiary">{contaNome}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="text-right mr-1">
            <p className="num text-[14px] font-semibold text-ink-primary whitespace-nowrap">{currency(valorAtual)}</p>
            <p className={`text-[11.5px] font-semibold whitespace-nowrap ${positivo ? "text-[#8FCB5E]" : "text-[#f87171]"}`}>
              {positivo ? "+" : ""}{rentabilidade.toFixed(2)}%
            </p>
          </div>
          <form action={deleteInvestimento} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-xl transition-colors" title="Excluir investimento">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </div>

      {/* BODY */}
      {open && (
        <div className="border-t border-surface-border/40 px-5 py-4 space-y-4">

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg/60 rounded-xl p-3 border border-surface-border/40">
              <p className="text-[11px] text-slate-500 mb-1">Total Aportado</p>
              <p className="text-sm font-semibold text-white">{currency(totalAportado)}</p>
            </div>
            <div className="bg-bg/60 rounded-xl p-3 border border-surface-border/40">
              <p className="text-[11px] text-slate-500 mb-1">Valor Investido</p>
              <p className="text-sm font-semibold text-white">{currency(valorInvestido)}</p>
            </div>
            <div className={`rounded-xl p-3 border ${positivo ? "bg-[#5DA832]/5 border-[#5DA832]/20" : "bg-rose-500/5 border-rose-500/20"}`}>
              <p className="text-[11px] text-slate-500 mb-1">Rentabilidade</p>
              <p className={`text-sm font-semibold ${positivo ? "text-[#5DA832]" : "text-rose-400"}`}>
                {positivo ? "+" : ""}{currency(valorAtual - valorInvestido)}
              </p>
            </div>
          </div>

          {/* Atualizar valor atual */}
          <div className="flex items-center gap-2">
            {!editando ? (
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#5DA832] transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Atualizar valor atual
              </button>
            ) : (
              <form
                action={async (formData) => {
                  await atualizarValorAtual(formData);
                  setEditando(false);
                  toast.success("Investimento salvo com sucesso");
                }}
                className="flex items-center gap-2"
              >
                <input type="hidden" name="id" value={id} />
                <input
                  type="number"
                  name="valor_atual"
                  value={novoValor}
                  onChange={e => setNovoValor(e.target.value)}
                  step="0.01"
                  min="0"
                  className="input-modern h-8 w-36 text-sm"
                />
                <button type="submit" className="px-3 py-1.5 rounded-xl bg-[#5DA832] text-white text-xs font-semibold hover:bg-[#6fc23b] transition-colors">
                  Salvar
                </button>
                <button type="button" onClick={() => setEditando(false)} className="text-xs text-slate-500 hover:text-slate-300">
                  Cancelar
                </button>
              </form>
            )}
          </div>

          {/* Histórico de movimentos */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 mb-2">Histórico</p>
            {movimentos.length === 0 ? (
              <p className="text-xs text-slate-600 italic">Nenhum aporte ou resgate registrado.</p>
            ) : (
              <div className="space-y-1">
                {movimentos.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-2/40 group/mov">
                    <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
                      m.tipo === "aporte" ? "bg-[#5DA832]/15 text-[#5DA832]" : "bg-rose-500/15 text-rose-400"
                    }`}>
                      {m.tipo === "aporte"
                        ? <TrendingUp className="h-3 w-3" />
                        : <TrendingDown className="h-3 w-3" />
                      }
                    </div>
                    <span className="text-xs text-slate-500 w-16 shrink-0">{dateBR(m.data)}</span>
                    <span className="text-xs text-slate-300 flex-1 truncate">{m.descricao || (m.tipo === "aporte" ? "Aporte" : "Resgate")}</span>
                    <span className={`text-xs font-semibold shrink-0 ${m.tipo === "aporte" ? "text-[#5DA832]" : "text-rose-400"}`}>
                      {m.tipo === "aporte" ? "+" : "-"}{currency(Number(m.valor))}
                    </span>
                    <form action={deleteMovimento} className="shrink-0">
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="opacity-80 group-hover/mov:opacity-100 p-1 text-slate-600 hover:text-rose-400 rounded transition-all">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
