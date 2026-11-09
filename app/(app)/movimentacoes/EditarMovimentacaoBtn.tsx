"use client";

import { useState } from "react";
import { Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { saveMovimentacao } from "@/app/(app)/actions";
import { FormGroup, Input, Select } from "@/components/ui";
import { dateBR } from "@/lib/format";

interface Props {
  mov: any;
  categorias: { id: string; nome: string }[];
  contas:     { id: string; nome: string }[];
  cartoes:    { id: string; nome: string }[];
  faturas:    { id: string; data_vencimento: string }[];
}

export default function EditarMovimentacaoBtn({ mov, categorias, contas, cartoes, faturas }: Props) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <div className="flex flex-row items-center gap-1">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="p-1.5 text-slate-600 hover:text-[#5DA832] rounded transition-colors"
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Modal centralizado (mesmo padrão de EditarDividaBtn/EditarPagamentoBtn/
  // RealizarPagamentoBtn) — o formulário antes ficava embutido dentro da
  // própria linha da lista (que hoje é flex, não grid), então "col-span-full"
  // não tinha efeito nenhum e o form era espremido pra fora da área visível.
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#141414] border border-[#5DA832]/40 w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between bg-[#5DA832]/10 sticky top-0 bg-[#141414]">
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
            <Pencil className="h-4 w-4 text-[#5DA832]" />
            Editar movimentação
          </h3>
          <button onClick={() => setAberto(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          action={async (formData) => {
            await saveMovimentacao(formData);
            setAberto(false);
            toast.success("Movimentação salva com sucesso");
          }}
          className="p-6 space-y-3"
        >
          <input type="hidden" name="id" value={mov.id} />

          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Tipo">
              <Select name="tipo" defaultValue={mov.tipo} required className="text-sm">
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </Select>
            </FormGroup>
            <FormGroup label="Valor">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span>
                <Input name="valor" type="number" step="0.01" defaultValue={mov.valor} required className="pl-8 text-sm font-semibold" />
              </div>
            </FormGroup>
          </div>

          <FormGroup label="Categoria">
            <Select name="categoria_id" defaultValue={mov.categoria_id} required className="text-sm">
              <option value="">Selecione...</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormGroup>

          <FormGroup label="Data">
            <Input name="data" type="date" defaultValue={mov.data} required className="text-sm" />
          </FormGroup>

          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Conta">
              <Select name="conta_id" defaultValue={mov.conta_id ?? ""} className="text-sm">
                <option value="">Nenhuma</option>
                {contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="Cartão">
              <Select name="cartao_id" defaultValue={mov.cartao_id ?? ""} className="text-sm">
                <option value="">Nenhum</option>
                {cartoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </FormGroup>
          </div>

          <FormGroup label="Fatura (em aberto)">
            <Select name="fatura_id" defaultValue={mov.fatura_id ?? ""} className="text-sm">
              <option value="">Nenhuma</option>
              {faturas.map(f => <option key={f.id} value={f.id}>{dateBR(f.data_vencimento)}</option>)}
            </Select>
          </FormGroup>

          <FormGroup label="Descrição">
            <Input name="descricao" defaultValue={mov.descricao ?? ""} placeholder="Descrição..." className="text-sm" />
          </FormGroup>

          <input type="hidden" name="status" value={mov.status ?? "realizado"} />

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
              <Check className="h-4 w-4" />
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
