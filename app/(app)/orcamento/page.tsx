import { getCategorias, getOrcamento, getRealizadoPorCategoria, parcelaInfoParaMes } from "@/lib/queries";
import { Input, Button } from "@/components/ui";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import OrcamentoBody from "./OrcamentoBody";

function competenciaAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function deslocarCompetencia(competencia: string, offset: number) {
  const [ano, mes] = competencia.slice(0, 7).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1 + offset, 1)).toISOString().slice(0, 10);
}

function labelCompetencia(competencia: string) {
  const d = new Date(`${competencia}T00:00:00Z`);
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Valor já com sinal: receita soma, despesa e parcela subtraem — usado tanto
// pra ordenar/somar as quinzenas quanto pra colorir a linha (verde/vermelho).
function valorComSinal(l: { kind: "item" | "parcela"; tipo?: "receita" | "despesa"; valor?: number; valor_parcela?: number }) {
  if (l.kind === "parcela") return -Number(l.valor_parcela);
  return l.tipo === "receita" ? Number(l.valor) : -Number(l.valor);
}

export default async function OrcamentoPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const competencia = sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) ? `${sp.mes}-01` : competenciaAtual();

  const [{ itens, parcelas }, categorias, realizadoPorCategoria] = await Promise.all([
    getOrcamento(competencia),
    getCategorias(),
    getRealizadoPorCategoria(competencia),
  ]);

  // Parcelas ativas neste mês, com "parcela X de Y" calculada automaticamente
  const parcelasAtivas = parcelas
    .map((p) => ({ ...p, ...parcelaInfoParaMes(p, competencia) }))
    .filter((p) => p.ativa);

  const receitas          = itens.filter((i) => i.tipo === "receita");
  const despesasFixas     = itens.filter((i) => i.tipo === "despesa" && i.subtipo === "fixo");
  const despesasVariaveis = itens.filter((i) => i.tipo === "despesa" && i.subtipo === "variavel");

  const totalReceitas  = receitas.reduce((s, i) => s + Number(i.valor), 0);
  const totalFixos     = despesasFixas.reduce((s, i) => s + Number(i.valor), 0);
  const totalVariaveis = despesasVariaveis.reduce((s, i) => s + Number(i.valor), 0);
  const totalParcelas  = parcelasAtivas.reduce((s, p) => s + Number(p.valor_parcela), 0);
  const totalCustos    = totalFixos + totalVariaveis + totalParcelas;
  const saldo          = totalReceitas - totalCustos;

  // Lançamentos combinados (receitas + despesas + parcelas ativas), separados
  // em duas quinzenas por dia_referencia — corte fixo em 15, sem opção de
  // ajuste. Ordenados por dia dentro de cada quinzena.
  const lancamentos = [
    ...receitas.map((i) => ({ ...i, kind: "item" as const })),
    ...despesasFixas.map((i) => ({ ...i, kind: "item" as const })),
    ...despesasVariaveis.map((i) => ({ ...i, kind: "item" as const })),
    ...parcelasAtivas.map((p) => ({ ...p, kind: "parcela" as const })),
  ];

  const quinzena1 = lancamentos
    .filter((l) => l.dia_referencia <= 14)
    .sort((a, b) => a.dia_referencia - b.dia_referencia);
  const quinzena2 = lancamentos
    .filter((l) => l.dia_referencia >= 15)
    .sort((a, b) => a.dia_referencia - b.dia_referencia);

  const subtotalQuinzena1 = quinzena1.reduce((s, l) => s + valorComSinal(l), 0);
  const subtotalQuinzena2 = quinzena2.reduce((s, l) => s + valorComSinal(l), 0);

  // Orçado por categoria (fixos + variáveis + parcelas ativas) — base do gráfico
  // de distribuição e do bloco "Orçado x realizado" (independe da quinzena)
  const orcadoPorCategoria = new Map<string, number>();
  for (const i of [...despesasFixas, ...despesasVariaveis]) {
    const chave = i.categoria_id || "sem_categoria";
    orcadoPorCategoria.set(chave, (orcadoPorCategoria.get(chave) || 0) + Number(i.valor));
  }
  for (const p of parcelasAtivas) {
    const chave = p.categoria_id || "sem_categoria";
    orcadoPorCategoria.set(chave, (orcadoPorCategoria.get(chave) || 0) + Number(p.valor_parcela));
  }

  const nomeCategoria = (id: string) => categorias.find((c) => c.id === id)?.nome ?? "Sem categoria";

  const comparativo = [...orcadoPorCategoria.entries()]
    .map(([categoriaId, orcado]) => {
      const realizado = realizadoPorCategoria.get(categoriaId) || 0;
      return {
        categoriaId,
        nome: nomeCategoria(categoriaId),
        orcado,
        realizado,
        pct: orcado > 0 ? Math.round((realizado / orcado) * 100) : 0,
      };
    })
    .sort((a, b) => b.orcado - a.orcado);

  const distribuicao = [...orcadoPorCategoria.entries()]
    .map(([categoriaId, valor]) => ({ name: nomeCategoria(categoriaId), value: valor }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const anterior = deslocarCompetencia(competencia, -1);
  const proxima  = deslocarCompetencia(competencia, 1);

  return (
    <div className="onfin-desktop-page space-y-5 md:space-y-6">
      <div className="flex items-center justify-between px-1">
        <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight">Orçamento</h1>

        <details className="relative shrink-0">
          <summary className="list-none cursor-pointer w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
            <Filter className="h-3.5 w-3.5" />
          </summary>
          <form className="absolute right-0 top-10 z-20 w-64 p-3.5 rounded-xl bg-surface border border-surface-border shadow-navy space-y-2.5">
            <p className="text-[11px] font-semibold text-ink-tertiary">Ir para o mês</p>
            <Input type="month" name="mes" defaultValue={competencia.slice(0, 7)} className="h-11 text-xs" />
            <Button type="submit" variant="secondary" className="w-full h-8 text-xs">Aplicar</Button>
          </form>
        </details>
      </div>

      {/* Navegação de mês — anterior / mês atual / próximo */}
      <div className="flex items-center gap-2">
        <a
          href={`/orcamento?mes=${anterior.slice(0, 7)}`}
          className="shrink-0 w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </a>
        <div className="flex-1 text-center px-3 py-1.5 rounded-full text-[12.5px] font-semibold border bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]">
          {labelCompetencia(competencia)}
        </div>
        <a
          href={`/orcamento?mes=${proxima.slice(0, 7)}`}
          className="shrink-0 w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <OrcamentoBody
        competencia={competencia}
        quinzena1={quinzena1}
        quinzena2={quinzena2}
        subtotalQuinzena1={subtotalQuinzena1}
        subtotalQuinzena2={subtotalQuinzena2}
        parcelasAtivas={parcelasAtivas}
        totalReceitas={totalReceitas}
        totalCustos={totalCustos}
        saldo={saldo}
        comparativo={comparativo}
        distribuicao={distribuicao}
        categorias={categorias}
      />
    </div>
  );
}
