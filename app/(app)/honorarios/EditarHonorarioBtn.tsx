"use client";

import { useState } from "react";
import { Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { saveHonorario } from "@/app/(app)/actions_honorarios";
import { Input, Select, Button, FormGroup } from "@/components/ui";

interface Props {
  honorario: {
    id: string;
    cliente_id: string;
    competencia: string; // "yyyy-MM-01"
    valor: number;
    vencimento: string;
    observacao: string | null;
  };
  clientes: { id: string; nome: string }[];
}

export default function EditarHonorarioBtn({ honorario, clientes }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label={`Editar honorário de ${honorario.id}`}
        title="Editar honorário"
        className="h-9 w-9 inline-flex items-center justify-center text-slate-500 hover:text-[#5DA832] hover:bg-[#5DA832]/10 rounded-xl transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-surface-border w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#141414]/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#5DA832]" />
            Editar Honorário
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await saveHonorario(formData);
            setIsEditing(false);
            toast.success("Honorário salvo com sucesso");
          }}
          className="p-6 space-y-4"
        >
          <input type="hidden" name="id" value={honorario.id} />

          <FormGroup label="Cliente">
            <Select name="cliente_id" defaultValue={honorario.cliente_id} required className="h-11">
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Competência">
              <Input
                name="competencia"
                type="month"
                defaultValue={honorario.competencia.slice(0, 7)}
                required
                className="h-11"
              />
            </FormGroup>
            <FormGroup label="Valor">
              <Input name="valor" type="number" step="0.01" min="0" defaultValue={honorario.valor} required className="h-11" />
            </FormGroup>
          </div>

          <FormGroup label="Vencimento">
            <Input name="vencimento" type="date" defaultValue={honorario.vencimento} required className="h-11" />
          </FormGroup>

          <FormGroup label="Observação">
            <Input name="observacao" defaultValue={honorario.observacao || ""} placeholder="Ex: Honorário contábil..." className="h-11" />
          </FormGroup>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
