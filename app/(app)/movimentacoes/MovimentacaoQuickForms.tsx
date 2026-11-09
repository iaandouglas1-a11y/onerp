"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X, ArrowLeftRight } from "lucide-react";
import { saveMovimentacao } from "@/app/(app)/actions";
import { realizarTransferencia } from "@/app/(app)/actions_transferencia";
import { FormGroup, Input, Select } from "@/components/ui";
import { dateBR } from "@/lib/format";

interface Props {
  categorias: { id: string; nome: string; tipo?: string }[];
  contas: { id: string; nome: string; ativo?: boolean }[];
  cartoes: { id: string; nome: string; ativo?: boolean }[];
  faturas: { id: string; cartao_id: string; data_vencimento: string; pago?: boolean }[];
  defaultTipo?: string;
}

export default function MovimentacaoQuickForms({ categorias, contas, cartoes, faturas, defaultTipo }: Props) {
  const searchParams = useSearchParams();
  const [aberto, setAberto] = useState<null | "transacao" | "transferencia">(null);
  const painel = aberto;
  const [tipo, setTipo] = useState(defaultTipo === "receita" ? "receita" : "despesa");
  const [cartaoId, setCartaoId] = useState("");
  const [data, setData] = useState("");
  useEffect(() => {
    if (searchParams.get("acao") === "transferencia") setAberto("transferencia");
    else if (searchParams.get("tipo")) setAberto("transacao");
  }, [searchParams]);
  const faturasVisiveis = faturas.filter((f) => {
    if (!cartaoId || f.cartao_id !== cartaoId || f.pago) return false;
    if (!data) return true;
    const limite = new Date(`${data}T12:00:00`);
    limite.setMonth(limite.getMonth() + 2);
    return new Date(`${f.data_vencimento}T12:00:00`) <= limite;
  });
  const normalizarTipo = (valor?: string) => String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/s$/, "");
  const categoriasVisiveis = categorias.filter((c) => !c.tipo || normalizarTipo(c.tipo) === tipo);
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setAberto((v) => v === "transacao" ? null : "transacao")} className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${painel === "transacao" ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]" : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"}`}>
          <Plus className="h-3.5 w-3.5" /> Nova transação
        </button>
        <button type="button" onClick={() => setAberto((v) => v === "transferencia" ? null : "transferencia")} className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${painel === "transferencia" ? "bg-info/15 border-info/40 text-[#CBD5E1]" : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"}`}>
          <ArrowLeftRight className="h-3.5 w-3.5" /> Transferência
        </button>
      </div>
      {painel === "transacao" && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs"><Plus className="h-4 w-4" /><span>Nova transação</span></div>
            <button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded"><X className="h-4 w-4" /></button>
          </div>
          <form action={saveMovimentacao} className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
              <FormGroup label="Tipo"><Select name="tipo" required value={tipo} onChange={(e) => { setTipo(e.target.value); setCartaoId(""); }} className="text-sm"><option value="despesa">Despesa</option><option value="receita">Receita</option></Select></FormGroup>
              <FormGroup label="Categoria"><Select name="categoria_id" required className="text-sm"><option value="">Selecione...</option>{categoriasVisiveis.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormGroup>
              <FormGroup label="Valor"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span><Input name="valor" type="number" step="0.01" min="0.01" placeholder="0,00" required className="pl-8 text-sm font-semibold" /></div></FormGroup>
              <FormGroup label="Data"><Input name="data" type="date" required value={data} onChange={(e) => setData(e.target.value)} className="text-sm" /></FormGroup>
            </div>
            <FormGroup label="Descrição (opcional)"><Input name="descricao" placeholder="Ex: Almoço com cliente..." className="h-11 text-sm w-full block" /></FormGroup>
            {tipo === "despesa" && <div className="grid grid-cols-2 gap-2 items-end">
              <FormGroup label="Conta bancária"><Select name="conta_id" className="text-sm"><option value="">Nenhuma</option>{contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormGroup>
              <FormGroup label="Cartão"><Select name="cartao_id" className="text-sm" value={cartaoId} onChange={(e) => setCartaoId(e.target.value)}><option value="">Nenhum</option>{cartoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormGroup>
            </div>}
            {tipo === "receita" && <FormGroup label="Conta bancária"><Select name="conta_id" required className="text-sm"><option value="">Selecione...</option>{contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormGroup>}
            {tipo === "despesa" && cartaoId && <div className="grid grid-cols-2 gap-2 items-end">
              <FormGroup label="Fatura (em aberto)"><Select name="fatura_id" required className="text-sm"><option value="">Selecione...</option>{faturasVisiveis.map((f) => <option key={f.id} value={f.id}>{dateBR(f.data_vencimento)}</option>)}</Select></FormGroup>
              <FormGroup label="Parcelas"><Input name="parcelas_total" type="number" min="1" step="1" defaultValue="1" className="text-sm" /></FormGroup>
            </div>}
            <input type="hidden" name="status" value="realizado" />
            <button type="submit" className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold"><Plus className="h-4 w-4" /> Confirmar</button>
          </form>
        </div>
      )}
      {painel === "transferencia" && (
        <div className="border border-info/30 rounded-xl p-4 bg-info/5 space-y-2">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[#CBD5E1] font-semibold text-xs"><ArrowLeftRight className="h-4 w-4" /><span>Transferência entre Contas</span></div><button type="button" onClick={() => setAberto(null)} className="md:hidden p-1 text-slate-500"><X className="h-4 w-4" /></button></div>
          <form action={realizarTransferencia} className="space-y-2">
            <div className="grid grid-cols-2 gap-2"><FormGroup label="Conta Origem"><Select name="conta_origem_id" required className="text-sm"><option value="">Selecione...</option>{contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormGroup><FormGroup label="Conta Destino"><Select name="conta_destino_id" required className="text-sm"><option value="">Selecione...</option>{contas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormGroup></div>
            <div className="grid grid-cols-2 gap-2"><FormGroup label="Valor"><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-xs">R$</span><Input name="valor" type="number" step="0.01" min="0.01" required className="pl-8 text-sm font-semibold" /></div></FormGroup><FormGroup label="Data"><Input name="data" type="date" required className="text-sm" /></FormGroup></div>
            <FormGroup label="Descrição (opcional)"><Input name="descricao" placeholder="Ex: Transferência para reserva..." className="text-sm" /></FormGroup>
            <button type="submit" className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-info text-white text-sm font-semibold"><Plus className="h-4 w-4" /> Confirmar Transferência</button>
          </form>
        </div>
      )}
    </div>
  );
}
