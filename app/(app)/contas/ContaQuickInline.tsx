"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { saveConta } from "@/app/(app)/actions";
import { FormGroup, Input, Select, Button, Card } from "@/components/ui";

export default function ContaQuickInline() {
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
        <Card className="border border-[#5DA832]/30 bg-[#5DA832]/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Nova conta</span>
            </div>

            <button
              type="button"
              onClick={() => setAberto(false)}
              className="p-1 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form action={saveConta} className="grid gap-3 sm:grid-cols-[1fr_180px_auto]">
            <FormGroup>
              <Input
                name="nome"
                placeholder="Nome da conta"
                required
                className="h-11"
              />
            </FormGroup>

            <FormGroup>
              <Select name="tipo" defaultValue="corrente" className="h-11">
                <option value="corrente">Conta Corrente</option>
                <option value="poupanca">Poupança</option>
                <option value="investimento">Investimento</option>
                <option value="dinheiro">Dinheiro</option>
              </Select>
            </FormGroup>

            <div className="flex items-end">
              <Button type="submit" className="h-11 px-5 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
