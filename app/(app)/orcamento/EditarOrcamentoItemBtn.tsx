"use client";

import { useState } from "react";
import { Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { saveOrcamentoItem } from "@/app/(app)/actions_orcamento";
import { Input, Select, Button, FormGroup } from "@/components/ui";

interface Props {
  item: {
    id: string;
    tipo: "receita" | "despesa";
    subtipo: "fixo" | "variavel";
    categoria_id: string | null;
    descricao: string;
    valor: number;
    dia_referencia: number;
  };
  categorias: { id: string; nome: string }[];
  competencia: string; // yyyy-MM-01
}

export default function EditarOrcamentoItemBtn({ item, categorias, competencia }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="p-1.5 text-slate-600 hover:text-[#5DA832] rounded transition-colors"
        title="Editar item"
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
            Editar item
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await saveOrcamentoItem(formData);
            setIsEditing(false);
            toast.success("Item de orçamento salvo com sucesso");
          }}
          className="p-6 space-y-4"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="tipo" value={item.tipo} />
          <input type="hidden" name="competencia" value={competencia.slice(0, 7)} />

          <FormGroup label="Descrição">
            <Input name="descricao" defaultValue={item.descricao} required className="h-11" />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Valor">
              <Input name="valor" type="number" step="0.01" min="0.01" defaultValue={item.valor} required className="h-11" />
            </FormGroup>
            <FormGroup label="Recorrência">
              <Select name="subtipo" defaultValue={item.subtipo} required className="h-11">
                <option value="fixo">Fixo</option>
                <option value="variavel">Variável</option>
              </Select>
            </FormGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Dia de referência">
              <Input name="dia_referencia" type="number" min="1" max="31" step="1" defaultValue={item.dia_referencia} required className="h-11" />
            </FormGroup>
            <FormGroup label="Categoria">
              <Select name="categoria_id" defaultValue={item.categoria_id ?? ""} className="h-11">
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </Select>
            </FormGroup>
          </div>

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
