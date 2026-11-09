"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { saveConta } from "@/app/(app)/actions";
import { Input, FormGroup, Select } from "@/components/ui";

interface Props {
  id: string;
  nome: string;
  tipo: string;
}

export default function EditarContaBtn({ id, nome, tipo }: Props) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:text-[#5DA832] hover:bg-[#5DA832]/10 border border-transparent hover:border-[#5DA832]/20 transition-all duration-200"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar conta
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await saveConta(formData);
        setAberto(false);
        toast.success("Conta salva com sucesso");
      }}
      className="space-y-2 pt-2 border-t border-surface-border/40"
    >
      <input type="hidden" name="id" value={id} />

      <FormGroup label="Nome">
        <Input name="nome" defaultValue={nome} required className="h-11 text-sm" />
      </FormGroup>

      <FormGroup label="Tipo">
        <Select name="tipo" defaultValue={tipo} className="h-11 text-sm">
          <option value="corrente">Conta Corrente</option>
          <option value="poupanca">Poupança</option>
          <option value="investimento">Investimento</option>
          <option value="dinheiro">Dinheiro</option>
        </Select>
      </FormGroup>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-xs font-semibold transition-all duration-200"
        >
          <Check className="h-3.5 w-3.5" />
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="h-11 px-3 inline-flex items-center justify-center rounded-xl border border-surface-border/40 text-slate-500 hover:text-slate-300 text-xs transition-all duration-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
