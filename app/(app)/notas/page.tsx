import { StickyNote } from "lucide-react";

// Mobile: a lista vem do layout. Desktop: painel vazio até escolher/criar uma nota.
export default function NotasPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-surface-border/70 py-32 text-center">
      <StickyNote className="h-10 w-10 text-slate-600" />
      <p className="text-sm text-slate-500">Selecione uma nota na lista ou crie uma nova.</p>
    </div>
  );
}
