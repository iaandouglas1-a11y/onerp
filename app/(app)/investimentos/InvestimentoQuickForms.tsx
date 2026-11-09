"use client";

import { useState } from "react";
import { Plus, X, Repeat, TrendingUp } from "lucide-react";
import { saveInvestimento, saveMovimento, saveSaldoMensal } from "@/app/(app)/actions_investimentos";
import { FormGroup, Input, Select } from "@/components/ui";

interface Props {
  contas: { id: string; nome: string }[];
  investimentos: { id: string; nome: string }[];
  mesAtual: string; // yyyy-MM
}

type Painel = null | "investimento" | "movimento" | "saldo";

const SUBCATEGORIAS: Record<"renda_fixa" | "renda_variavel", string[]> = {
  renda_fixa: ["Tesouro Direto", "CDB", "LCI/LCA", "Debênture", "Fundo de Renda Fixa", "Poupança", "Outro"],
  renda_variavel: ["Ações", "FII", "ETF", "BDR", "Fundo Multimercado", "Criptomoeda", "Outro"],
};

/** Três botões lado a lado no topo — "Investimento", "Aporte/Resgate" e
 * "Saldo mensal" — mesmo padrão visual do MovimentacaoQuickForms /
 * DividaQuickForms: sempre visíveis, cada um revela seu formulário completo
 * (com botão de fechar) só quando clicado. */
export default function InvestimentoQuickForms({ contas, investimentos, mesAtual }: Props) {
  const [aberto, setAberto] = useState<Painel>(null);
  const painel = aberto;
  const [tipoInv, setTipoInv] = useState<"renda_fixa" | "renda_variavel">("renda_fixa");

  const toggle = (p: Painel) => setAberto((v) => (v === p ? null : p));

  const anoAtual = new Date().getFullYear();
  const meses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(i);
    const val = `${anoAtual}-${String(i + 1).padStart(2, "0")}`;
    return { val, label: d.toLocaleDateString("pt-BR", { month: "long" }) + ` ${anoAtual}` };
  });

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => toggle("investimento")}
          className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-[11.5px] font-semibold border text-center leading-tight transition-all duration-200 ${
            painel === "investimento"
              ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Investimento
        </button>
        <button
          type="button"
          onClick={() => toggle("movimento")}
          className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-[11.5px] font-semibold border text-center leading-tight transition-all duration-200 ${
            painel === "movimento"
              ? "bg-info/15 border-info/40 text-[#CBD5E1]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Repeat className="h-3.5 w-3.5" />
          Aporte/Resgate
        </button>
        <button
          type="button"
          onClick={() => toggle("saldo")}
          className={`flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-[11.5px] font-semibold border text-center leading-tight transition-all duration-200 ${
            painel === "saldo"
              ? "bg-warning/15 border-warning/40 text-[#f5a524]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Saldo mensal
        </button>
      </div>

      {/* Painel: Novo investimento */}
      {painel === "investimento" && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Novo investimento</span>
            </div>
            <button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form action={saveInvestimento} className="space-y-2">
            <FormGroup label="Nome">
              <Input name="nome" placeholder="Ex: CDB Nubank, PETR4..." required className="h-11 text-sm w-full" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Tipo">
                <Select
                  name="tipo"
                  required
                  className="h-11 text-sm w-full"
                  value={tipoInv}
                  onChange={(e) => setTipoInv(e.target.value as "renda_fixa" | "renda_variavel")}
                >
                  <option value="renda_fixa">Renda Fixa</option>
                  <option value="renda_variavel">Renda Variável</option>
                </Select>
              </FormGroup>
              <FormGroup label="Subcategoria">
                <Select name="subcategoria" className="h-11 text-sm w-full" defaultValue="">
                  <option value="">Sem subcategoria</option>
                  {SUBCATEGORIAS[tipoInv].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Ticker">
                <Input name="ticker" placeholder="PETR4" className="h-11 text-sm font-mono w-full" />
              </FormGroup>
              <FormGroup label="Conta">
                <Select name="conta_id" className="h-11 text-sm w-full">
                  <option value="">Nenhuma</option>
                  {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </FormGroup>
            </div>
            <FormGroup label="Valor Atual">
              <Input name="valor_atual" type="number" step="0.01" min="0" placeholder="0,00" className="h-11 text-sm w-full" />
            </FormGroup>
            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* Painel: Registrar aporte/resgate */}
      {painel === "movimento" && (
        <div className="border border-info/30 rounded-xl p-4 bg-info/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#CBD5E1] font-semibold text-xs">
              <Repeat className="h-4 w-4" />
              <span>Registrar Aporte / Resgate</span>
            </div>
            <button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form action={saveMovimento} className="space-y-2">
            <FormGroup label="Investimento">
              <Select name="investimento_id" required className="h-11 text-sm w-full">
                <option value="">Selecione...</option>
                {investimentos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </Select>
            </FormGroup>
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Tipo">
                <Select name="tipo" required className="h-11 text-sm w-full">
                  <option value="aporte">Aporte</option>
                  <option value="resgate">Resgate</option>
                </Select>
              </FormGroup>
              <FormGroup label="Valor">
                <Input name="valor" type="number" step="0.01" min="0.01" placeholder="0,00" required className="h-11 text-sm w-full" />
              </FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Data">
                <Input name="data" type="date" required className="h-11 w-full text-sm" />
              </FormGroup>
              <FormGroup label="Conta">
                <Select name="conta_id" className="h-11 text-sm w-full">
                  <option value="">Nenhuma</option>
                  {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </FormGroup>
            </div>
            <FormGroup label="Descrição">
              <Input name="descricao" placeholder="Opcional..." className="h-11 text-sm w-full" />
            </FormGroup>
            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-info hover:brightness-110 text-white text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Registrar
            </button>
          </form>
        </div>
      )}

      {/* Painel: Atualizar saldo mensal */}
      {painel === "saldo" && (
        <div className="border border-warning/30 rounded-xl p-4 bg-warning/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#f5a524] font-semibold text-xs">
              <TrendingUp className="h-4 w-4" />
              <span>Atualizar Saldo Mensal</span>
            </div>
            <button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form action={saveSaldoMensal} className="space-y-2">
            <FormGroup label="Investimento">
              <Select name="investimento_id" required className="h-11 text-sm w-full">
                <option value="">Selecione...</option>
                {investimentos.map((i) => <option key={i.id} value={i.id}>{i.nome}</option>)}
              </Select>
            </FormGroup>
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Mês">
                <Select name="mes" required className="h-11 text-sm w-full" defaultValue={mesAtual}>
                  {meses.map((m) => <option key={m.val} value={m.val}>{m.label}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Saldo">
                <Input name="saldo" type="number" step="0.01" min="0" placeholder="0,00" required className="h-11 text-sm w-full" />
              </FormGroup>
            </div>
            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-warning hover:brightness-110 text-[#0A0A0A] text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Salvar
            </button>
          </form>
          <p className="text-[11px] text-slate-500">
            Registrar o saldo do mês atualiza automaticamente o "Valor Atual" do investimento e alimenta o gráfico de evolução. Se já existir um registro para o mesmo mês, ele será substituído.
          </p>
        </div>
      )}
    </div>
  );
}
