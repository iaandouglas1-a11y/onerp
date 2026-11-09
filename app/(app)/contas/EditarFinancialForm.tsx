"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { FormGroup, Input, Select } from "@/components/ui";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Item = { id: string; nome: string; tipo: "conta" | "cartao"; limite?: number };

type Props = {
  items: Item[];
  onClose: () => void;
  onSaved?: () => void;
};

export function EditarFinancialForm({ items, onClose, onSaved }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [nome, setNome] = useState("");
  const [limite, setLimite] = useState(0);
  const [loading, setLoading] = useState(false);

  const selected = items.find((i) => i.id === selectedId) || null;

  function handleSelect(id: string) {
    setSelectedId(id);
    const item = items.find((i) => i.id === id);
    setNome(item?.nome ?? "");
    setLimite(item?.limite ?? 0);
  }

  async function handleSave() {
    if (!selected) return;
    setLoading(true);

    const updatesNovo = selected.tipo === "cartao" ? { nome, limite } : { nome };

    const updateNovo = supabase.from("financeiro_itens").update(updatesNovo).eq("id", selected.id);
    const updateLegacy =
      selected.tipo === "cartao"
        ? supabase.from("cartoes").update({ nome, limite }).eq("id", selected.id)
        : supabase.from("contas").update({ nome }).eq("id", selected.id);

    const [{ error: e1 }, { error: e2 }] = await Promise.all([updateNovo, updateLegacy]);
    setLoading(false);

    if (!e1 && !e2) {
      toast.success("Alterações salvas com sucesso");
      onSaved?.();
    } else {
      console.error("Erro update dual:", e1 || e2);
    }
  }

  return (
    <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
          <Pencil className="h-4 w-4" />
          <span>Editar conta ou cartão</span>
        </div>
        <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <FormGroup label="Conta ou cartão">
        <Select value={selectedId} onChange={(e) => handleSelect(e.target.value)} className="text-sm">
          <option value="">Selecione...</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome} ({i.tipo === "cartao" ? "Cartão" : "Conta"})
            </option>
          ))}
        </Select>
      </FormGroup>

      {selected && (
        <>
          <div className={selected.tipo === "cartao" ? "grid grid-cols-2 gap-2" : ""}>
            <FormGroup label="Nome">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="text-sm" />
            </FormGroup>
            {selected.tipo === "cartao" && (
              <FormGroup label="Limite">
                <Input
                  type="number"
                  step="0.01"
                  value={limite}
                  onChange={(e) => setLimite(Number(e.target.value))}
                  className="text-sm"
                />
              </FormGroup>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          >
            <Pencil className="h-4 w-4" />
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </>
      )}
    </div>
  );
}
