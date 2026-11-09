"use client";

import { SplitLayout } from "@/components/SplitLayout";
import { useState } from "react";
import { Trash2, Copy, PiggyBank, Receipt } from "lucide-react";
import { Card, StatPill, AmountText, EmptyState, ProgressBar, Badge, IconChip } from "@/components/ui";
import { currency } from "@/lib/format";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { deleteOrcamentoItem, deleteOrcamentoParcela, duplicarOrcamento } from "@/app/(app)/actions_orcamento";
import { CategoryPie } from "@/components/Charts";
import OrcamentoQuickForms from "./OrcamentoQuickForms";
import EditarOrcamentoItemBtn from "./EditarOrcamentoItemBtn";
import EditarOrcamentoParcelaBtn from "./EditarOrcamentoParcelaBtn";

type Item = {
  id: string;
  tipo: "receita" | "despesa";
  subtipo: "fixo" | "variavel";
  categoria_id: string | null;
  descricao: string;
  valor: number;
  dia_referencia: number;
  categorias?: { nome: string; icone?: string | null } | null;
};

type Parcela = {
  id: string;
  descricao: string;
  categoria_id: string | null;
  valor_parcela: number;
  parcelas_total: number;
  data_primeira_parcela: string;
  dia_referencia: number;
  categorias?: { nome: string; icone?: string | null } | null;
  parcelaAtual: number;
  parcelasTotal: number;
};

type Lancamento = (Item & { kind: "item" }) | (Parcela & { kind: "parcela" });

type Comparativo = { categoriaId: string; nome: string; orcado: number; realizado: number; pct: number };

type Props = {
  competencia: string;
  quinzena1: Lancamento[];
  quinzena2: Lancamento[];
  subtotalQuinzena1: number;
  subtotalQuinzena2: number;
  parcelasAtivas: Parcela[];
  totalReceitas: number;
  totalCustos: number;
  saldo: number;
  comparativo: Comparativo[];
  distribuicao: { name: string; value: number }[];
  categorias: { id: string; nome: string }[];
};

// Uma linha de lançamento mistura receita, despesa e parcela — o sinal e a
// cor vêm do tipo/kind; parcelas ganham um selo "Parcela X/Y" além do dia.
function LancamentoRow({
  lancamento,
  categorias,
  competencia,
}: {
  lancamento: Lancamento;
  categorias: { id: string; nome: string }[];
  competencia: string;
}) {
  const isParcela = lancamento.kind === "parcela";
  const nomeCategoria = lancamento.categorias?.nome ?? "Sem categoria";
  const Icon = getCategoryIcon(nomeCategoria, lancamento.categorias?.icone);
  const valor = isParcela
    ? -Number(lancamento.valor_parcela)
    : lancamento.tipo === "receita" ? Number(lancamento.valor) : -Number(lancamento.valor);
  const tone: "green" | "red" | "purple" = isParcela ? "purple" : valor >= 0 ? "green" : "red";

  return (
    <div className="list-row">
      <IconChip icon={Icon} tone={tone} />
      <div className="min-w-0 flex-1">
        {/* Nome da categoria é o texto principal (mais resumido); a descrição
            do lançamento vira legenda, pra continuar visível caso o usuário
            queira ver do que se trata — mesmo padrão de Movimentações. */}
        <div className="text-[14px] font-semibold text-ink-primary truncate">{nomeCategoria}</div>
        <div className="text-[11.5px] text-ink-tertiary mt-0.5 truncate">{lancamento.descricao}</div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[11px] font-semibold text-ink-tertiary bg-surface-2 rounded-full px-2 py-0.5">
            Dia {lancamento.dia_referencia}
          </span>
          {isParcela && (
            <span className="text-[11px] font-semibold text-[#c084fc] bg-[#8b5cf6]/10 rounded-full px-2 py-0.5">
              Parcela {lancamento.parcelaAtual}/{lancamento.parcelasTotal}
            </span>
          )}
        </div>
      </div>
      <AmountText value={valor} signed />
      <div className="action-row">
        {isParcela ? (
          <>
            <EditarOrcamentoParcelaBtn parcela={lancamento} categorias={categorias} />
            <form action={deleteOrcamentoParcela}>
              <input type="hidden" name="id" value={lancamento.id} />
              <button type="submit" className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-xl transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </>
        ) : (
          <>
            <EditarOrcamentoItemBtn item={lancamento} categorias={categorias} competencia={competencia} />
            <form action={deleteOrcamentoItem}>
              <input type="hidden" name="id" value={lancamento.id} />
              <button type="submit" className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-xl transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function QuinzenaCard({
  titulo,
  subtitulo,
  itens,
  subtotal,
  categorias,
  competencia,
}: {
  titulo: string;
  subtitulo: string;
  itens: Lancamento[];
  subtotal: number;
  categorias: { id: string; nome: string }[];
  competencia: string;
}) {
  return (
    <Card className="border-surface-border/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">{titulo}</h2>
        <AmountText value={subtotal} signed />
      </div>
      <p className="text-xs text-ink-tertiary mt-1 mb-3">{subtitulo}</p>
      {itens.length === 0 ? (
        <EmptyState icon={<Receipt className="h-10 w-10" />} title="Nada lançado nesta quinzena" />
      ) : (
        <div>
          {itens.map((l) => (
            <LancamentoRow key={`${l.kind}-${l.id}`} lancamento={l} categorias={categorias} competencia={competencia} />
          ))}
        </div>
      )}
    </Card>
  );
}

export default function OrcamentoBody({
  competencia,
  quinzena1,
  quinzena2,
  subtotalQuinzena1,
  subtotalQuinzena2,
  parcelasAtivas,
  totalReceitas,
  totalCustos,
  saldo,
  comparativo,
  distribuicao,
  categorias,
}: Props) {
  const [confirmandoDuplicar, setConfirmandoDuplicar] = useState(false);
  const acimaDoOrcado = comparativo.filter((c) => c.pct > 100);

  return (
<SplitLayout className="onfin-module-orcamento" top={<>
      {/* Hero: saldo projetado do orçamento — mês inteiro */}
      <div className="glass-card p-6">
        <div className="text-[11px] font-semibold text-ink-secondary">Saldo do orçamento</div>
        <AmountText value={saldo} size="hero" className="block mt-1.5" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [&>*]:min-w-0">
        <StatPill label="Renda estimada" value={currency(totalReceitas)} tone="green" />
        <StatPill label="Custos estimados" value={currency(totalCustos)} tone="red" />
      </div>

</>} aside={<>
      <OrcamentoQuickForms competencia={competencia} categorias={categorias} />

</>}>
      {/* Quinzena 1 e 2 — receitas, despesas e parcelas ativas misturadas,
          agrupadas por dia_referencia (corte fixo: 1-14 / 15-31) */}
      <div className="onfin-module-two-col">
      <QuinzenaCard
        titulo="Quinzena 1"
        subtitulo="Dias 1 a 14 · saldo do período"
        itens={quinzena1}
        subtotal={subtotalQuinzena1}
        categorias={categorias}
        competencia={competencia}
      />
      <QuinzenaCard
        titulo="Quinzena 2"
        subtitulo="Dias 15 a 31 · saldo do período"
        itens={quinzena2}
        subtotal={subtotalQuinzena2}
        categorias={categorias}
        competencia={competencia}
      />
      </div>

      {/* Compras parceladas — visão de progresso, independente da quinzena */}
      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">Compras parceladas</h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {parcelasAtivas.length} {parcelasAtivas.length === 1 ? "ativa" : "ativas"} neste mês
          </p>
        </div>
        {parcelasAtivas.length === 0 ? (
          <EmptyState icon={<PiggyBank className="h-10 w-10" />} title="Nenhuma parcela ativa neste mês" />
        ) : (
          <div className="divide-y divide-surface-border/40">
            {parcelasAtivas.map((p) => (
              <div key={p.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink-primary truncate">{p.descricao}</p>
                    <p className="text-[11px] text-ink-tertiary mt-0.5">
                      {p.parcelaAtual} de {p.parcelasTotal} · {currency(Number(p.valor_parcela))} · Dia {p.dia_referencia}
                    </p>
                  </div>
                  <div className="action-row !border-l-0 !pl-0 !ml-2">
                    <EditarOrcamentoParcelaBtn parcela={p} categorias={categorias} />
                    <form action={deleteOrcamentoParcela}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-xl transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
                <ProgressBar pct={(p.parcelaAtual / p.parcelasTotal) * 100} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Distribuição do orçamento — mesmo CategoryPie de Investimentos/Dashboard */}
      <div className="onfin-module-two-col">
      {distribuicao.length > 0 && (
        <Card className="border-surface-border/60 p-4">
          <div className="mb-4 pb-3 border-b border-surface-border/50">
            <h2 className="text-[15px] font-semibold text-white">Distribuição do orçamento</h2>
            <p className="text-xs text-ink-tertiary mt-1">Por categoria, incluindo parcelas ativas</p>
          </div>
          <CategoryPie data={distribuicao} />
        </Card>
      )}

      {/* Orçado x realizado */}
      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">Orçado x realizado</h2>
          <p className="text-xs text-ink-tertiary mt-1">Comparado com as movimentações já lançadas no mês</p>
        </div>
        {comparativo.length === 0 ? (
          <p className="text-center py-6 text-sm text-slate-600 italic">Nenhum custo orçado para comparar ainda.</p>
        ) : (
          <div className="divide-y divide-surface-border/40">
            {comparativo.map((c) => (
              <div key={c.categoriaId} className="py-3">
                <div className="flex items-center justify-between gap-2 text-[12.5px]">
                  <span className="text-ink-primary font-medium truncate">{c.nome}</span>
                  <span className={c.pct > 100 ? "text-[#f87171] font-semibold shrink-0" : "text-ink-tertiary shrink-0"}>
                    {currency(c.realizado)} de {currency(c.orcado)}
                  </span>
                </div>
                <ProgressBar
                  pct={Math.min(100, c.pct)}
                  color={c.pct > 100 ? "#f87171" : c.pct > 85 ? "#F5A524" : "#5DA832"}
                />
              </div>
            ))}
          </div>
        )}
        {acimaDoOrcado.length > 0 && (
          <div className="text-center pt-3">
            <Badge variant="error">
              {acimaDoOrcado.length} {acimaDoOrcado.length === 1 ? "categoria acima" : "categorias acima"} do orçado
            </Badge>
          </div>
        )}
      </Card>

      </div>

      {/* Duplicar orçamento para o próximo mês */}
      {!confirmandoDuplicar ? (
        <button
          type="button"
          onClick={() => setConfirmandoDuplicar(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary transition-all duration-200"
        >
          <Copy className="h-3.5 w-3.5" />
          Duplicar orçamento para o próximo mês
        </button>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface border border-surface-border/60">
          <span className="text-xs text-ink-secondary flex-1">
            Copiar receitas e custos fixos/variáveis (com o mesmo dia) para o próximo mês? Parcelas continuam automáticas.
          </span>
          <form
            action={async (formData) => {
              await duplicarOrcamento(formData);
              setConfirmandoDuplicar(false);
            }}
          >
            <input type="hidden" name="competencia" value={competencia} />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-xs font-semibold transition-colors"
            >
              Confirmar
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirmandoDuplicar(false)}
            className="px-2 py-1.5 text-ink-tertiary hover:text-ink-primary text-xs transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </SplitLayout>
  );
}
