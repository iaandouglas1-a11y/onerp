"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { currency, dateBR } from "@/lib/format";
import { deletePagamento } from "@/app/(app)/actions_dividas";
import { Badge } from "@/components/ui";
import RealizarPagamentoBtn from "./RealizarPagamentoBtn";
import DesfazerPagamentoBtn from "./DesfazerPagamentoBtn";
import EditarPagamentoBtn from "./EditarPagamentoBtn";

interface Props {
  pagamento: {
    id: string;
    descricao: string;
    data: string;
    valor: number;
    tipo: "orcado" | "realizado";
    conta_id: string | null;
    categoria_id: string | null;
  };
  categoriaNome: string | null;
  contas: { id: string; nome: string }[];
  categorias: { id: string; nome: string }[];
}

/** Linha de pagamento — colapsada mostra só descrição/valor/status; clique
 * expande com data, categoria e ações (realizar/desfazer, editar, excluir). */
export default function PagamentoAccordion({ pagamento: p, categoriaNome, contas, categorias }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={clsx(p.tipo === "realizado" && "bg-[#5DA832]/[0.03]")}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
        className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-surface-2/30 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink-primary truncate">{p.descricao}</p>
          <p className="text-[11px] text-ink-tertiary truncate mt-0.5">{dateBR(p.data)}</p>
        </div>
        <p className="num text-[13.5px] font-semibold text-ink-primary whitespace-nowrap shrink-0">{currency(Number(p.valor))}</p>
        {p.tipo === "realizado" ? (
          <Badge variant="success" className="text-[11px] shrink-0">✓</Badge>
        ) : (
          <Badge variant="warning" className="text-[11px] shrink-0">Orçado</Badge>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-slate-500 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />}
      </div>

      {open && (
        <div className="px-3.5 pb-3">
          {categoriaNome && <p className="text-[11px] text-ink-tertiary mb-2">Categoria: {categoriaNome}</p>}
          <div className="action-row !justify-start !border-l-0 !pl-0 !ml-0 pt-2 border-t border-surface-border/30">
            {p.tipo === "orcado" ? (
              <RealizarPagamentoBtn
                pagamentoId={p.id}
                descricao={p.descricao}
                valor={Number(p.valor)}
                data={p.data}
                contas={contas}
                categorias={categorias}
                categoriaId={p.categoria_id}
              />
            ) : (
              <DesfazerPagamentoBtn pagamentoId={p.id} tipo={p.tipo} />
            )}
            <EditarPagamentoBtn
              pagamento={{
                id: p.id,
                data: p.data,
                descricao: p.descricao,
                valor: Number(p.valor),
                tipo: p.tipo,
                conta_id: p.conta_id,
                categoria_id: p.categoria_id,
              }}
              contas={contas}
              categorias={categorias}
            />
            <form action={deletePagamento}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-xl transition-colors" title="Excluir">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
