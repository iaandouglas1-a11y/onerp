"use client";

import { useState } from "react";
import { ArrowLeftRight, Plus, X } from "lucide-react";
import { realizarTransferencia } from "@/app/(app)/actions_transferencia";
import { FormGroup, Input, Select } from "@/components/ui";

interface Props {
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string }[];
}

export default function TransferenciaBtn({ contas, categorias }: Props) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700/40 border border-surface-border/40 hover:border-surface-border transition-all duration-200"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Transferência entre contas
      </button>
    );
  }

  return (
    <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
          <ArrowLeftRight className="h-4 w-4" />
          <span>Transferência entre Contas</span>
        </div>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form action={realizarTransferencia} className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Conta Origem">
            <Select name="conta_origem_id" required className="text-sm">
              <option value="">Selecione...</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Conta Destino">
            <Select name="conta_destino_id" required className="text-sm">
              <option value="">Selecione...</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormGroup>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Valor">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span>
              <Input name="valor" type="number" step="0.01" min="0.01" placeholder="0,00" required className="pl-8 text-sm font-semibold" />
            </div>
          </FormGroup>
          <FormGroup label="Data">
            <Input name="data" type="date" required className="text-sm" />
          </FormGroup>
        </div>
        <FormGroup label="Descrição (opcional)">
          <Input name="descricao" placeholder="Ex: Transferência para reserva..." className="text-sm" />
        </FormGroup>
        <button
          type="submit"
          className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-sm font-semibold transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Confirmar Transferência
        </button>
      </form>
    </div>
  );
}
