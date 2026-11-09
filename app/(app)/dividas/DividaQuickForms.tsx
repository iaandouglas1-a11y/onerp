"use client";

import { useState } from "react";
import { Plus, X, CircleDollarSign } from "lucide-react";
import { saveDivida, savePagamento } from "@/app/(app)/actions_dividas";
import { FormGroup, Input, Select } from "@/components/ui";

interface Props {
  categorias: { id: string; nome: string }[];
  contas: { id: string; nome: string }[];
  dividasAbertas: { id: string; descricao: string }[];
}

/** Botões "Nova dívida" / "Novo pagamento" lado a lado, no topo da página —
 * mesmo padrão visual e de comportamento do MovimentacaoQuickForms
 * (Movimentações): botões sempre visíveis, cada um revela seu formulário
 * completo (com botão de fechar) só quando clicado. */
export default function DividaQuickForms({ categorias, contas, dividasAbertas }: Props) {
  const [aberto, setAberto] = useState<null | "divida" | "pagamento">(null);
  const painel = aberto;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAberto((v) => (v === "divida" ? null : "divida"))}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
            painel === "divida"
              ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          Nova dívida
        </button>
        <button
          type="button"
          onClick={() => setAberto((v) => (v === "pagamento" ? null : "pagamento"))}
          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
            painel === "pagamento"
              ? "bg-info/15 border-info/40 text-[#CBD5E1]"
              : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <CircleDollarSign className="h-3.5 w-3.5" />
          Novo pagamento
        </button>
      </div>

      {/* Painel: Nova dívida */}
      {painel === "divida" && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Nova dívida</span>
            </div>
            <button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form action={saveDivida} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FormGroup label="Data">
              <Input name="data" type="date" required className="text-sm" />
            </FormGroup>
            <FormGroup label="Valor total">
              <Input name="valor" type="number" step="0.01" min="0.01" placeholder="0,00" required className="text-sm" />
            </FormGroup>
            <FormGroup label="Descrição">
              <Input name="descricao" placeholder="Ex: Celular, Empréstimo..." required className="text-sm" />
            </FormGroup>
            <FormGroup label="Observação">
              <Input name="observacao" placeholder="Ex: 10x R$ 140,00" className="text-sm" />
            </FormGroup>
            <FormGroup label="Categoria">
              <Select name="categoria_id" className="text-sm">
                <option value="">Sem categoria</option>
                {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </Select>
            </FormGroup>
            <input type="hidden" name="situacao" value="pendente" />
            <button
              type="submit"
              className="sm:col-span-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </form>
        </div>
      )}

      {/* Painel: Novo pagamento */}
      {painel === "pagamento" && (
        <div className="border border-info/30 rounded-xl p-4 bg-info/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#CBD5E1] font-semibold text-xs">
              <CircleDollarSign className="h-4 w-4" />
              <span>Novo pagamento</span>
            </div>
            <button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form action={savePagamento} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FormGroup label="Data">
              <Input name="data" type="date" required className="text-sm" />
            </FormGroup>
            <FormGroup label="Descrição">
              <Input name="descricao" placeholder="Ex: Gasolina, Cerveja..." required className="text-sm" />
            </FormGroup>
            <FormGroup label="Valor">
              <Input name="valor" type="number" step="0.01" min="0.01" placeholder="0,00" required className="text-sm" />
            </FormGroup>
            <FormGroup label="Tipo">
              <Select name="tipo" required className="text-sm">
                <option value="orcado">Orçado</option>
                <option value="realizado">Realizado</option>
              </Select>
            </FormGroup>
            <FormGroup label="Dívida vinculada">
              <Select name="divida_id" className="text-sm">
                <option value="">Nenhuma (avulso)</option>
                {dividasAbertas.map((d) => <option key={d.id} value={d.id}>{d.descricao}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Conta">
              <Select name="conta_id" className="text-sm">
                <option value="">Nenhuma</option>
                {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Categoria" className="sm:col-span-2">
              <Select name="categoria_id" className="text-sm">
                <option value="">Sem categoria</option>
                {categorias.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </Select>
            </FormGroup>
            <button
              type="submit"
              className="sm:col-span-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-info hover:brightness-110 text-white text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
