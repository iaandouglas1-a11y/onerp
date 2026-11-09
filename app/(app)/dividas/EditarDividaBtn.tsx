"use client";

import { useState } from "react";
import { Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { saveDivida } from "@/app/(app)/actions_dividas";
import { Input, Select, Button, FormGroup } from "@/components/ui";

interface Props {
  divida: {
    id: string;
    data: string;
    descricao: string;
    valor: number;
    observacao: string | null;
    categoria_id: string | null;
    situacao: "pendente" | "liquidado" | "parcial";
  };
  categorias: { id: string; nome: string }[];
}

export default function EditarDividaBtn({ divida, categorias }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-slate-600 hover:text-[#5DA832] rounded transition-colors"
        title="Editar lançamento"
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
            Editar Dívida
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await saveDivida(formData);
            setIsEditing(false);
            toast.success("Dívida salva com sucesso");
          }}
          className="p-6 space-y-4"
        >
          <input type="hidden" name="id" value={divida.id} />
          
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Data">
              <Input name="data" type="date" defaultValue={divida.data} required className="h-11" />
            </FormGroup>
            <FormGroup label="Valor Total">
              <Input name="valor" type="number" step="0.01" min="0.01" defaultValue={divida.valor} required className="h-11" />
            </FormGroup>
          </div>

          <FormGroup label="Descrição">
            <Input name="descricao" defaultValue={divida.descricao} required className="h-11" />
          </FormGroup>

          <FormGroup label="Observação">
            <Input name="observacao" defaultValue={divida.observacao || ""} className="h-11" />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Categoria">
              <Select name="categoria_id" defaultValue={divida.categoria_id || ""} className="h-11">
                <option value="">Sem categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="Situação">
              <Select name="situacao" defaultValue={divida.situacao} className="h-11">
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="liquidado">Liquidado</option>
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
