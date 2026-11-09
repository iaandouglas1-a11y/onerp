"use client";

import { X } from "lucide-react";

/**
 * Botão de fechar para formulários colapsáveis (<details>/<summary>).
 * Sobe até o <details> ancestral mais próximo e fecha (open = false).
 * Client component isolado — pode ser embutido em Server Components normalmente.
 */
export default function CloseDetailsButton({ label }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const details = (e.currentTarget as HTMLElement).closest("details");
        if (details) details.open = false;
      }}
      className="p-1 text-slate-500 hover:text-slate-300 rounded transition-colors shrink-0"
      title={label ? `Fechar ${label}` : "Fechar"}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
