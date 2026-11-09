"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Circle, Trash2, CircleDollarSign } from "lucide-react";
import { clsx } from "clsx";
import { currency, dateBR } from "@/lib/format";
import { alterarSituacaoDivida, deleteDivida } from "@/app/(app)/actions_dividas";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { IconChip, Badge, AmountText, ProgressBar } from "@/components/ui";
import type { IconTone } from "@/components/ui";
import EditarDividaBtn from "./EditarDividaBtn";

interface Props {
  divida: {
    id: string;
    descricao: string;
    valor: number;
    data: string;
    situacao: string;
    observacao: string | null;
    categoria_id: string | null;
  };
  categorias: { id: string; nome: string }[];
  categoriaNome?: string | null;
  tone: IconTone;
  pct: number;
  pagos: number;
}

/** Card de dívida — colapsado mostra só o essencial (nome, status, valor);
 * clique expande com data, progresso e ações (liquidar/editar/excluir).
 *
 * Recebe `categoriaNome` (texto) em vez do ícone já resolvido: um componente
 * de ícone (função/forwardRef) não pode ser passado como prop de um Server
 * Component para um Client Component — só é serializável quando já vem
 * renderizado como JSX. Por isso o ícone é resolvido aqui dentro, no cliente,
 * usando o mesmo getCategoryIcon() usado no restante do app. */
export default function DividaAccordion({ divida, categorias, categoriaNome, tone, pct, pagos }: Props) {
  const [open, setOpen] = useState(false);
  const liquidada = divida.situacao === "liquidado";
  const CatIcon = categoriaNome ? getCategoryIcon(categoriaNome) : CircleDollarSign;

  return (
    <div className={clsx("surface-2 bg-surface overflow-hidden flex items-stretch", liquidada && "opacity-60")}>
      <div className="min-w-0 flex-1">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpen((v) => !v); }}
        className="w-full flex items-center gap-3 p-3.5 cursor-pointer hover:bg-surface-2/40 transition-colors"
      >
        <IconChip icon={CatIcon} tone={tone} size={38} iconSize={17} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-ink-primary truncate">{divida.descricao}</div>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {liquidada ? (
              <Badge variant="success" className="text-[11px]">✓ Liquidado</Badge>
            ) : (
              <Badge variant={pct > 0 ? "warning" : "error"} className="text-[11px]">
                {pct > 0 ? `Parcial · ${Math.round(pct)}% pago` : "Pendente"}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AmountText value={Number(divida.valor)} tone={liquidada ? "neutral" : "red"} />
          {open ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </div>
      </div>

      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="text-[11px] text-ink-tertiary flex items-center gap-1.5 flex-wrap mb-2">
            <span>{dateBR(divida.data)}</span>
            {divida.observacao && <span>· {divida.observacao}</span>}
          </div>

          {!liquidada && (
            <>
              <ProgressBar pct={pct} color={pct > 60 ? "#5DA832" : pct > 0 ? "#F5A524" : "#2A2A2A"} />
              {pagos > 0 && (
                <p className="text-[11px] text-ink-tertiary mt-1.5">
                  {currency(pagos)} pagos de {currency(Number(divida.valor))}
                </p>
              )}
            </>
          )}

        </div>
      )}
      </div>

      {/* Ações na extremidade direita do card: liquidar/reabrir, editar e excluir */}
      <div className="action-col mr-2 my-2">
        <form action={alterarSituacaoDivida}>
          <input type="hidden" name="id" value={divida.id} />
          <input type="hidden" name="situacao" value={divida.situacao} />
          <button
            type="submit"
            title={liquidada ? "Reabrir dívida" : "Marcar como liquidada"}
            className={clsx("p-1.5 rounded-lg transition-colors", liquidada ? "text-[#5DA832]" : "text-slate-500 hover:text-[#5DA832]")}
          >
            {liquidada ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>
        </form>
        <EditarDividaBtn divida={divida as any} categorias={categorias} />
        <form action={deleteDivida}>
          <input type="hidden" name="id" value={divida.id} />
          <button type="submit" title="Excluir" className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-lg transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
