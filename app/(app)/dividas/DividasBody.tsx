"use client";

import { SplitLayout } from "@/components/SplitLayout";
import { useState, useMemo } from "react";
import { Plus, TrendingDown } from "lucide-react";
import { Card, StatPill } from "@/components/ui";
import { currency } from "@/lib/format";
import DividaAccordion from "./DividaAccordion";
import PagamentoAccordion from "./PagamentoAccordion";
import DividaQuickForms from "./DividaQuickForms";

type Props = {
  totalDevido: number;
  totalPago: number;
  saldoAtual: number;
  dividasAbertas: any[];
  dividasLiquidadas: any[];
  fluxo: any[];
  categorias: any[];
  contas: any[];
};

export default function DividasBody({
  totalDevido,
  totalPago,
  saldoAtual,
  dividasAbertas,
  dividasLiquidadas,
  fluxo,
  categorias,
  contas,
}: Props) {
  const [aba, setAba] = useState<"aberto" | "liquidado">("aberto");
  const [filtroFluxo, setFiltroFluxo] = useState<"este_mes" | "mes_anterior" | "2_meses" | "personalizado">("este_mes");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const lista = aba === "aberto" ? dividasAbertas : dividasLiquidadas;

  // Filtro de datas pro fluxo
  const hoje = new Date();
  const fluxoFiltrado = useMemo(() => {
    if (fluxo.length === 0) return [];

    let dtInicio: Date;
    let dtFim: Date;

    if (filtroFluxo === "este_mes") {
      dtInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dtFim = hoje;
    } else if (filtroFluxo === "mes_anterior") {
      dtInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      dtFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    } else if (filtroFluxo === "2_meses") {
      dtInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
      dtFim = hoje;
    } else {
      // Personalizado
      if (!dataInicio || !dataFim) return [];
      dtInicio = new Date(dataInicio);
      dtFim = new Date(dataFim);
    }

    return fluxo.filter(p => {
      if (!p.data) return false;
      const dataPag = new Date(p.data);
      return dataPag >= dtInicio && dataPag <= dtFim;
    });
  }, [fluxo, filtroFluxo, dataInicio, dataFim, hoje]);

  return (
<SplitLayout className="onfin-module-dividas" top={<>
      {/* Métricas — 3 pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface/50 border border-surface-border/40 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Total devido</p>
          <p className="text-lg font-semibold text-rose-400">{currency(totalDevido)}</p>
        </div>
        <div className="bg-surface/50 border border-surface-border/40 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold text-slate-500 mb-1">Total pago</p>
          <p className="text-lg font-semibold text-emerald-400">{currency(totalPago)}</p>
        </div>
      </div>

      <div className="bg-surface/50 border border-surface-border/40 rounded-xl p-3.5">
        <p className="text-[11px] font-semibold text-slate-500 mb-1">Saldo em aberto</p>
        <p className="text-lg font-semibold text-amber-400">{currency(saldoAtual)}</p>
      </div>

</>} aside={<>
      {/* Botões — Nova dívida | Novo pagamento */}
      <DividaQuickForms categorias={categorias} contas={contas} dividasAbertas={dividasAbertas} />

</>}>
      {/* Toggle Aberto/Liquidado */}
      <div className="flex gap-1.5 bg-surface-2/60 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setAba("aberto")}
          className={`flex-1 text-center py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
            aba === "aberto" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary hover:text-ink-secondary"
          }`}
        >
          Em aberto ({dividasAbertas.length})
        </button>
        <button
          type="button"
          onClick={() => setAba("liquidado")}
          className={`flex-1 text-center py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
            aba === "liquidado" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary hover:text-ink-secondary"
          }`}
        >
          Liquidadas ({dividasLiquidadas.length})
        </button>
      </div>

      {/* Lista de dívidas */}
      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">
            {aba === "aberto" ? "Dívidas em aberto" : "Dívidas liquidadas"}
          </h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {lista.length} {lista.length === 1 ? "dívida" : "dívidas"}
          </p>
        </div>

        <div className="space-y-2.5">
          {lista.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-600 italic">
              {aba === "aberto" ? "Nenhuma dívida em aberto. 🎉" : "Nenhuma dívida liquidada ainda."}
            </p>
          ) : (
            lista.map((d) => (
              <DividaAccordion
                key={d.id}
                divida={d}
                categorias={categorias}
                categoriaNome={d.categoriaNome}
                tone={d.situacao === "liquidado" ? "green" : d.pct > 0 ? "amber" : "red"}
                pct={d.pct}
                pagos={d.pagos}
              />
            ))
          )}
        </div>
      </Card>

      {/* Fluxo de Pagamentos */}
      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">Fluxo de pagamentos</h2>
          <p className="text-xs text-ink-tertiary mt-1">Pagamentos registrados por data</p>
        </div>

        {/* Filtro de datas */}
        <div className="mb-4 pb-3 border-b border-surface-border/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltroFluxo("este_mes")}
            className={`shrink-0 text-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all duration-200 border whitespace-nowrap ${
              filtroFluxo === "este_mes"
                ? "bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]"
                : "bg-transparent border-surface-border/50 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2/40"
            }`}
          >
            Este mês
          </button>
          <button
            type="button"
            onClick={() => setFiltroFluxo("mes_anterior")}
            className={`shrink-0 text-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all duration-200 border whitespace-nowrap ${
              filtroFluxo === "mes_anterior"
                ? "bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]"
                : "bg-transparent border-surface-border/50 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2/40"
            }`}
          >
            Mês anterior
          </button>
          <button
            type="button"
            onClick={() => setFiltroFluxo("2_meses")}
            className={`shrink-0 text-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all duration-200 border whitespace-nowrap ${
              filtroFluxo === "2_meses"
                ? "bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]"
                : "bg-transparent border-surface-border/50 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2/40"
            }`}
          >
            2 meses atrás
          </button>

          {/* Espaçador para empurrar botões para a direita */}
          <div className="flex-1" />

          {/* Botão X para limpar filtro personalizado */}
          {filtroFluxo === "personalizado" && (
            <button
              type="button"
              onClick={() => {
                setFiltroFluxo("este_mes");
                setDataInicio("");
                setDataFim("");
              }}
              className="shrink-0 h-7 w-7 rounded-full border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors"
              title="Limpar filtro"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Botão filtro personalizado */}
          <details className="relative shrink-0">
            <summary className="list-none cursor-pointer w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2H3V6M7 12h10M5 18h14" />
              </svg>
            </summary>
            <form className="absolute right-0 top-10 z-20 w-72 p-3.5 rounded-xl bg-surface border border-surface-border space-y-2.5">
              <p className="text-[11px] font-semibold text-ink-tertiary">Período personalizado</p>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setFiltroFluxo("personalizado");
                  }}
                  className="h-11 flex-1 min-w-0 text-xs px-2 rounded-xl bg-surface-2 border border-surface-border/40 text-white"
                />
                <span className="text-slate-600 text-[11px] shrink-0">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value);
                    setFiltroFluxo("personalizado");
                  }}
                  className="h-11 flex-1 min-w-0 text-xs px-2 rounded-xl bg-surface-2 border border-surface-border/40 text-white"
                />
              </div>
            </form>
          </details>
        </div>

        {/* Lista de pagamentos */}
        <div className="space-y-0 divide-y divide-surface-border/40">
          {fluxoFiltrado.length === 0 ? (
            <p className="text-center py-6 text-sm text-slate-600 italic">
              Nenhum pagamento neste período.
            </p>
          ) : (
            fluxoFiltrado.map((p) => {
              const categoriaNome = p.categoria_id
                ? categorias.find(cat => cat.id === p.categoria_id)?.nome ?? null
                : null;
              return (
                <PagamentoAccordion
                  key={p.id}
                  pagamento={p}
                  categoriaNome={categoriaNome}
                  contas={contas}
                  categorias={categorias}
                />
              );
            })
          )}
        </div>
      </Card>
    </SplitLayout>
  );
}
