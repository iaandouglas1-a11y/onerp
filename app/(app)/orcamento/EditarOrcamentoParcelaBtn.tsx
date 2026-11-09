"use client";

import { useState } from "react";
import { Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { saveOrcamentoParcela } from "@/app/(app)/actions_orcamento";
import { Input, Select, Button, FormGroup } from "@/components/ui";

interface Props {
  parcela: {
    id: string;
    descricao: string;
    categoria_id: string | null;
    valor_parcela: number;
    parcelas_total: number;
    data_primeira_parcela: string; // yyyy-MM-01
    dia_referencia: number;
  };
  categorias: { id: string; nome: string }[];
}

export default function EditarOrcamentoParcelaBtn({ parcela, categorias }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="p-1.5 text-slate-600 hover:text-[#5DA832] rounded transition-colors"
        title="Editar compra parcelada"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-surface-border w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#141414]/50">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Pencil className="h-4 w-4 text-[#5DA832]" />
            Editar compra parcelada
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await saveOrcamentoParcela(formData);
            setIsEditing(false);
            toast.success("Compra parcelada salva com sucesso");
          }}
          className="p-6 space-y-4"
        >
          <input type="hidden" name="id" value={parcela.id} />

          <FormGroup label="Descrição">
            <Input name="descricao" defaultValue={parcela.descricao} required className="h-11" />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Valor da parcela">
              <Input name="valor_parcela" type="number" step="0.01" min="0.01" defaultValue={parcela.valor_parcela} required className="h-11" />
            </FormGroup>
            <FormGroup label="Nº de parcelas">
              <Input name="parcelas_total" type="number" step="1" min="2" defaultValue={parcela.parcelas_total} required className="h-11" />
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="1ª parcela">
              <Input name="data_primeira_parcela" type="month" defaultValue={parcela.data_primeira_parcela.slice(0, 7)} required className="h-11" />
            </FormGroup>
            <FormGroup label="Dia de referência">
              <Input name="dia_referencia" type="number" min="1" max="31" step="1" defaultValue={parcela.dia_referencia} required className="h-11" />
            </FormGroup>
          </div>

          <FormGroup label="Categoria">
            <Select name="categoria_id" defaultValue={parcela.categoria_id ?? ""} className="h-11">
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
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
