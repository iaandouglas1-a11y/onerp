"use client";

import { SplitLayout } from "@/components/SplitLayout";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Wallet, CreditCard, Archive, ArchiveRestore } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Card, EntityLogo, AmountText, EmptyState, ProgressBar } from "@/components/ui";
import type { IconTone } from "@/components/ui";
import { currency } from "@/lib/format";
import { FinancialQuickInline } from "./FinancialQuickInline";
import { EditarFinancialForm } from "./EditarFinancialForm";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Item = {
  id: string;
  nome: string;
  tipo: "conta" | "cartao";
  ativo: boolean;
  logo_url?: string | null;
  saldo: number;
  limite?: number;
  usado?: number;
  disponivel?: number;
};

type Tone = "green" | "red" | "amber" | "neutral";

// Contas: saldo 0 → neutral · negativo → red · positivo → green
function contaTone(saldo: number): { icon: IconTone; text: Tone } {
  if (Math.abs(saldo) < 0.005) return { icon: "gray", text: "neutral" };
  return saldo > 0 ? { icon: "green", text: "green" } : { icon: "red", text: "red" };
}

// Cartões: disponível → branco · até 50% usado → verde · até 90% → âmbar · 100%+ → vermelho
function cartaoTone(usado: number, limite: number): { icon: IconTone; text: Tone; barColor: string } {
  const pct = limite > 0 ? (usado / limite) * 100 : 0;
  if (usado <= 0 || pct <= 0) return { icon: "gray", text: "neutral", barColor: "#94A3B8" };
  if (pct <= 50) return { icon: "green", text: "green", barColor: "#5DA832" };
  if (pct <= 90) return { icon: "amber", text: "amber", barColor: "#F5A524" };
  return { icon: "red", text: "red", barColor: "#f87171" };
}

export default function ContasCartoesBody({ contas, cartoes }: { contas: Item[]; cartoes: Item[] }) {
  const router = useRouter();
  const [painelAberto, setPainelAberto] = useState<null | "editar" | "adicionar">(null);
  const painel = painelAberto;
  const [aba, setAba] = useState<"ativos" | "arquivados">("ativos");

  const todosItens = [...contas, ...cartoes];
  const contasVisiveis = contas.filter((c) => aba === "ativos" ? c.ativo : !c.ativo);
  const cartoesVisiveis = cartoes.filter((c) => aba === "ativos" ? c.ativo : !c.ativo);
  async function alternarAtivo(item: Item) {
    const { error } = await supabase.from("financeiro_itens").update({ ativo: !item.ativo }).eq("id", item.id);
    if (!error) router.refresh();
  }

  return (
<SplitLayout className="onfin-module-contas" top={<>
      <div className="flex gap-1.5 bg-surface-2/60 rounded-xl p-1">
        <button type="button" onClick={() => setAba("ativos")} className={`flex-1 py-2 rounded-xl text-[12.5px] font-semibold ${aba === "ativos" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary"}`}>Ativos</button>
        <button type="button" onClick={() => setAba("arquivados")} className={`flex-1 py-2 rounded-xl text-[12.5px] font-semibold ${aba === "arquivados" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary"}`}>Arquivados</button>
      </div>
</>} aside={<>
      {/* Ações do topo — mesmo padrão visual de "Nova transação" / "Transferência" */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setPainelAberto((v) => (v === "editar" ? null : "editar"))}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
            painel === "editar"
              ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => setPainelAberto((v) => (v === "adicionar" ? null : "adicionar"))}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
            painel === "adicionar"
              ? "bg-info/15 border-info/40 text-[#CBD5E1]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar conta
        </button>
      </div>

      {/* Painel: Editar conta ou cartão */}
      {painel === "editar" && (
        <EditarFinancialForm
          items={todosItens}
          onClose={() => setPainelAberto(null)}
          onSaved={() => {
            setPainelAberto(null);
            router.refresh();
          }}
        />
      )}

      {/* Painel: Adicionar conta */}
      {painel === "adicionar" && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Nova conta ou cartão</span>
            </div>
            <button
              type="button"
              onClick={() => setPainelAberto(null)}
              className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <FinancialQuickInline
            onCreated={() => {
              setPainelAberto(null);
              router.refresh();
            }}
          />
        </div>
      )}

</>}>
      <div className="onfin-module-two-col">
      {/* Contas */}
      <Card className="p-0 overflow-hidden border-surface-border/60">
        <div className="px-4 pt-4 pb-3 mb-1 border-b border-surface-border/40">
          <h2 className="text-[15px] font-semibold text-white">Contas</h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {contasVisiveis.length} {contasVisiveis.length === 1 ? "conta" : "contas"} {aba === "ativos" ? "ativas" : "arquivadas"}
          </p>
        </div>

        {contasVisiveis.length === 0 ? (
          <EmptyState icon={<Wallet className="h-10 w-10" />} title={aba === "ativos" ? "Nenhuma conta ativa" : "Nenhuma conta arquivada"} />
        ) : (
          <div className="divide-y divide-surface-border/40">
            {contasVisiveis.map((c) => {
              const tone = contaTone(c.saldo);
              return (
                <div key={c.id} className="p-4 flex items-center gap-3">
                  <EntityLogo src={c.logo_url} icon={Wallet} tone={tone.icon} size={48} iconSize={22} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{c.nome}</p>
                    <p className="text-xs text-slate-500">Conta</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <AmountText value={c.saldo} tone={tone.text} />
                    <button type="button" onClick={() => alternarAtivo(c)} title={c.ativo ? "Arquivar conta" : "Reativar conta"} className="p-1.5 text-slate-500 hover:text-[#8FCB5E] rounded-xl transition-colors">
                      {c.ativo ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Cartões */}
      <Card className="p-0 overflow-hidden border-surface-border/60">
        <div className="px-4 pt-4 pb-3 mb-1 border-b border-surface-border/40">
          <h2 className="text-[15px] font-semibold text-white">Cartões</h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {cartoesVisiveis.length} {cartoesVisiveis.length === 1 ? "cartão" : "cartões"} {aba === "ativos" ? "ativos" : "arquivados"}
          </p>
        </div>

        {cartoesVisiveis.length === 0 ? (
          <EmptyState icon={<CreditCard className="h-10 w-10" />} title={aba === "ativos" ? "Nenhum cartão ativo" : "Nenhum cartão arquivado"} />
        ) : (
          <div className="divide-y divide-surface-border/40">
            {cartoesVisiveis.map((c) => {
              const limite = c.limite ?? 0;
              const usado = c.usado ?? 0;
              const pct = limite > 0 ? (usado / limite) * 100 : 0;
              const tone = cartaoTone(usado, limite);
              return (
                <div key={c.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <EntityLogo src={c.logo_url} icon={CreditCard} tone={tone.icon} size={48} iconSize={22} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate">{c.nome}</p>
                      <p className="text-xs text-slate-500">
                        {currency(usado)} de {currency(limite)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AmountText value={c.disponivel ?? 0} tone={tone.text} />
                      <button type="button" onClick={() => alternarAtivo(c)} title={c.ativo ? "Arquivar cartão" : "Reativar cartão"} className="p-1.5 text-slate-500 hover:text-[#8FCB5E] rounded-xl transition-colors">
                        {c.ativo ? <Archive className="h-3.5 w-3.5" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  <ProgressBar pct={pct} color={tone.barColor} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
      </div>
    </SplitLayout>
  );
}
