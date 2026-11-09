"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { saveConta } from "@/app/(app)/actions";
import { FormGroup, Input, Select } from "@/components/ui";

export default function ContaQuickForm() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="space-y-2.5">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
          aberto
            ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]"
            : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
        }`}
      >
        <Plus className="h-3.5 w-3.5" />
        Nova conta
      </button>

      {aberto && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Nova conta</span>
            </div>
            <button type="button" onClick={() => setAberto(false)}>
              <X className="h-4 w-4 text-slate-500 hover:text-slate-300" />
            </button>
          </div>

          <form action={saveConta} className="space-y-2">
            <FormGroup label="Nome">
              <Input name="nome" required className="text-sm" />
            </FormGroup>

            <FormGroup label="Tipo">
              <Select name="tipo" required className="text-sm">
                <option value="">Selecione...</option>
                <option value="corrente">Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="dinheiro">Dinheiro</option>
              </Select>
            </FormGroup>

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Criar conta
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
