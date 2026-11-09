"use client";

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { realizarPagamento } from "@/app/(app)/actions_dividas";

interface Props {
  pagamentoId:  string;
  descricao:    string;
  valor:        number;
  data:         string;
  contas:       { id: string; nome: string }[];
  categorias:   { id: string; nome: string }[];
  categoriaId:  string | null;
}

export default function RealizarPagamentoBtn({ pagamentoId, descricao, valor, data, contas, categorias, categoriaId }: Props) {
  const [aberto, setAberto] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState(contas[0]?.id ?? "");
  const [catSelecionada, setCatSelecionada] = useState(categoriaId ?? categorias[0]?.id ?? "");

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="p-1 text-slate-600 hover:text-[#5DA832] rounded transition-colors"
        title="Realizar pagamento"
      >
        <CheckCircle className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-[#5DA832]/40 w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#5DA832]/10">
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-[#5DA832]" />
            Confirmar Pagamento
          </h3>
          <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={realizarPagamento} className="p-6 space-y-4">
          <input type="hidden" name="id" value={pagamentoId} />
          
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Descrição</label>
            <input 
              name="descricao" 
              defaultValue={descricao} 
              className="w-full h-11 bg-surface/50 border border-surface-border rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#5DA832]/50" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Data</label>
              <input 
                name="data" 
                type="date" 
                defaultValue={data} 
                className="w-full h-11 bg-surface/50 border border-surface-border rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#5DA832]/50" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Valor</label>
              <input 
                name="valor" 
                type="number" 
                step="0.01" 
                defaultValue={valor} 
                className="w-full h-11 bg-surface/50 border border-surface-border rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#5DA832]/50" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Conta</label>
            <select
              name="conta_id"
              value={contaSelecionada}
              onChange={(e) => setContaSelecionada(e.target.value)}
              className="w-full h-11 bg-surface/50 border border-surface-border rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#5DA832]/50"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500">Categoria</label>
            <select
              name="categoria_id"
              value={catSelecionada}
              onChange={(e) => setCatSelecionada(e.target.value)}
              className="w-full h-11 bg-surface/50 border border-surface-border rounded-xl px-3 text-sm text-white focus:outline-none focus:border-[#5DA832]/50"
            >
              <option value="">Sem categoria</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={() => setAberto(false)} 
              className="flex-1 h-11 rounded-xl border border-surface-border text-slate-400 hover:bg-surface-2/60 hover:text-white transition-all text-sm font-semibold"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 h-11 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5DA832]/20"
            >
              <CheckCircle className="h-4 w-4" />
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
