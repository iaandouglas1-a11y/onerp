"use client";

import { SplitLayout } from "@/components/SplitLayout";
import { useState } from "react";
import { Plus, X, Receipt } from "lucide-react";
import { Card, FormGroup, Input, Select, EmptyState } from "@/components/ui";
import { saveFatura } from "@/app/(app)/actions";
import FaturaAccordion from "./FaturaAccordion";

type FaturaItem = {
  faturaId: string;
  cartaoId: string;
  cartaoNome: string;
  cartaoLogo: string | null;
  dataFechamento: string;
  dataVencimento: string;
  pago: boolean;
  pagoEm: string | null;
  observacao: string | null;
  total: number;
  antecipado: number;
  restante: number;
  isOverdue: boolean;
  isDue: boolean;
  expenses: any[];
};

type Props = {
  cartoes: { id: string; nome: string }[];
  faturasAbertas: FaturaItem[];
  faturasPagas: FaturaItem[];
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string }[];
  faturasResumo: { id: string; data_vencimento: string }[];
};

export default function FaturasBody({
  cartoes,
  faturasAbertas,
  faturasPagas,
  contas,
  categorias,
  faturasResumo,
}: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [aba, setAba] = useState<"aberto" | "pago">("aberto");

  const lista = aba === "aberto" ? faturasAbertas : faturasPagas;

  return (
<SplitLayout className="onfin-module-faturas" aside={<>
      {/* Criar fatura — mesmo padrão de "Nova transação" */}
      <button
        type="button"
        onClick={() => setPainelAberto((v) => !v)}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
          painelAberto
            ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]"
            : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
        }`}
      >
        <Plus className="h-3.5 w-3.5" />
        Criar fatura
      </button>

      {painelAberto && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Nova fatura</span>
            </div>
            <button
              type="button"
              onClick={() => setPainelAberto(false)}
              className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            action={async (formData) => {
              await saveFatura(formData);
              setPainelAberto(false);
            }}
            className="space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Cartão">
                <Select name="cartao_id" required className="text-sm">
                  <option value="">Selecione...</option>
                  {cartoes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup label="Fechamento">
                <Input name="data_fechamento" type="date" required className="text-sm" />
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Vencimento">
                <Input name="data_vencimento" type="date" required className="text-sm" />
              </FormGroup>
              <FormGroup label="Observação (opcional)">
                <Input name="observacao" placeholder="Ex: Fatura de junho..." className="text-sm" />
              </FormGroup>
            </div>

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Criar
            </button>
          </form>
        </div>
      )}

</>}>
      {/* Em aberto / Pagas — só um bloco visível por vez */}
      <div className="flex gap-1.5 bg-surface-2/60 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setAba("aberto")}
          className={`flex-1 text-center py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
            aba === "aberto" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary hover:text-ink-secondary"
          }`}
        >
          Em aberto
        </button>
        <button
          type="button"
          onClick={() => setAba("pago")}
          className={`flex-1 text-center py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
            aba === "pago" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary hover:text-ink-secondary"
          }`}
        >
          Pagas
        </button>
      </div>

      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">
            {aba === "aberto" ? "Faturas em aberto" : "Faturas pagas"}
          </h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {lista.length} {lista.length === 1 ? "fatura" : "faturas"}{" "}
            {aba === "aberto" ? "aguardando pagamento" : "já quitadas"}
          </p>
        </div>

        <div className="space-y-3">
          {lista.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-10 w-10" />}
              title={aba === "aberto" ? "Nenhuma fatura em aberto" : "Nenhuma fatura paga"}
            />
          ) : (
            lista.map((f) => (
              <FaturaAccordion
                key={f.faturaId}
                faturaId={f.faturaId}
                cartaoId={f.cartaoId}
                cartaoNome={f.cartaoNome}
                cartaoLogo={f.cartaoLogo}
                dataFechamento={f.dataFechamento}
                dataVencimento={f.dataVencimento}
                pago={f.pago}
                pagoEm={f.pagoEm}
                observacao={f.observacao}
                total={f.total}
                antecipado={f.antecipado}
                restante={f.restante}
                isOverdue={f.isOverdue}
                isDue={f.isDue}
                expenses={f.expenses}
                contas={contas}
                categorias={categorias}
                cartoes={cartoes}
                faturas={faturasResumo}
              />
            ))
          )}
        </div>
      </Card>
    </SplitLayout>
  );
}
