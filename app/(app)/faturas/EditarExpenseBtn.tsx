"use client";

import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { saveMovimentacao, deleteMovimentacao } from "@/app/(app)/actions";
import { FormGroup, Input, Select } from "@/components/ui";

interface Props {
  exp:        any;
  categorias: { id: string; nome: string }[];
  contas:     { id: string; nome: string }[];
  cartoes:    { id: string; nome: string }[];
  faturas:    { id: string; data_vencimento: string }[];
}

export default function EditarExpenseBtn({ exp, categorias, contas, cartoes, faturas }: Props) {
  const [modo, setModo] = useState<null | "editar">(null);

  if (!modo) {
    return (
      <div className="action-col opacity-80 group-hover/exp:opacity-100 transition-opacity self-center">
        <button
          type="button"
          onClick={() => setModo("editar")}
          className="p-1.5 text-slate-600 hover:text-[#5DA832] rounded transition-colors"
          title="Editar"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <form action={deleteMovimentacao}>
          <input type="hidden" name="id" value={exp.id} />
          <button
            type="submit"
            className="p-1.5 text-slate-600 hover:text-rose-400 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-[#141414]/80 border border-[#5DA832]/20 rounded-xl space-y-2">
      <form
        action={async (formData) => {
          await saveMovimentacao(formData);
          setModo(null);
          toast.success("Despesa salva com sucesso");
        }}
        className="space-y-2"
      >
        <input type="hidden" name="id" value={exp.id} />
        <input type="hidden" name="tipo" value="despesa" />
        <input type="hidden" name="status" value={exp.status ?? "realizado"} />
        <input type="hidden" name="cartao_id" value={exp.cartao_id ?? ""} />
        <input type="hidden" name="fatura_id" value={exp.fatura_id ?? ""} />

        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Categoria">
            <Select name="categoria_id" defaultValue={exp.categoria_id ?? ""} required className="text-sm">
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormGroup>
          <FormGroup label="Valor">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span>
              <Input name="valor" type="number" step="0.01" defaultValue={exp.valor} required className="pl-8 text-sm font-semibold" />
            </div>
          </FormGroup>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormGroup label="Data">
            <Input name="data" type="date" defaultValue={exp.data} required className="text-sm" />
          </FormGroup>
          <FormGroup label="Conta">
            <Select name="conta_id" defaultValue={exp.conta_id ?? ""} className="text-sm">
              <option value="">Nenhuma</option>
              {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormGroup>
        </div>

        <FormGroup label="Descrição">
          <Input name="descricao" defaultValue={exp.descricao ?? ""} placeholder="Descrição..." className="text-sm" />
        </FormGroup>

        <div className="flex gap-2">
          <button type="submit"
            className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-xs font-semibold transition-all">
            <Check className="h-3.5 w-3.5" /> Salvar
          </button>
          <button type="button" onClick={() => setModo(null)}
            className="h-11 px-3 inline-flex items-center justify-center rounded-xl border border-surface-border/40 text-slate-500 hover:text-slate-300 text-xs transition-all">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
