import { getInvestimentos, getContasWithMovs, getInvestimentoSaldos } from "@/lib/queries";
import { SplitLayout } from "@/components/SplitLayout";
import { Card, StatPill, Input, Button } from "@/components/ui";
import { currency, dateBR } from "@/lib/format";
import { TrendingUp, Filter } from "lucide-react";
import InvestimentoAccordion from "./InvestimentoAccordion";
import InvestimentoQuickForms from "./InvestimentoQuickForms";
import { InvestimentoEvolutionChart, CategoryPie } from "@/components/Charts";

function formatMesLabel(mes: string) {
  const [ano, m] = mes.split("-");
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${nomes[Number(m) - 1]}/${ano.slice(2)}`;
}

const MESES_RAPIDOS = [
  { label: "Este mês", offset: 0 },
  { label: "Mês anterior", offset: -1 },
  { label: "2 meses atrás", offset: -2 },
];

function monthRange(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1));
  const end   = new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0));
  return {
    inicio: start.toISOString().slice(0, 10),
    fim:    end.toISOString().slice(0, 10),
  };
}

export default async function InvestimentosPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [{ investimentos, movimentos }, { contas }, { saldos }] = await Promise.all([
    getInvestimentos(),
    getContasWithMovs(),
    getInvestimentoSaldos(),
  ]);

  const contasList = contas.map(c => ({ id: c.id, nome: c.nome }));
  const investimentosList = investimentos.map(i => ({ id: i.id, nome: i.nome }));

  // Filtro de período ativo? (precisa vir cedo — usado pra recortar tudo abaixo)
  const filtroAtivo = Boolean(sp.inicio || sp.fim);
  const dataCorte = sp.fim ?? sp.inicio ?? null;
  const mesLimite = filtroAtivo && dataCorte ? dataCorte.slice(0, 7) : null; // yyyy-MM

  // Evolução do patrimônio: soma dos saldos registrados por mês (agregado)
  const saldosPorMes = new Map<string, number>();
  // Saldo por investimento e por mês — permite reconstruir o valor "como estava"
  // de cada investimento (e por tipo) numa data de corte, não só o total.
  const saldosPorInvestimento = new Map<string, Map<string, number>>();
  for (const s of saldos) {
    const mesKey = s.mes.slice(0, 7); // yyyy-MM
    saldosPorMes.set(mesKey, (saldosPorMes.get(mesKey) || 0) + Number(s.saldo));

    if (!saldosPorInvestimento.has(s.investimento_id)) {
      saldosPorInvestimento.set(s.investimento_id, new Map());
    }
    saldosPorInvestimento.get(s.investimento_id)!.set(mesKey, Number(s.saldo));
  }

  // Evolução truncada na data de corte — não faz sentido mostrar meses
  // futuros em relação ao período selecionado.
  const evolutionData = Array.from(saldosPorMes.entries())
    .filter(([mes]) => !mesLimite || mes <= mesLimite)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, saldo]) => ({ mes: formatMesLabel(mes), saldo }));

  // Saldo de um investimento específico "como estava" até o mês de corte —
  // usa o registro mensal mais recente <= mesLimite; sem registro = ainda
  // não existia patrimônio (0), nunca cai pro valor atual ao vivo.
  function saldoInvestimentoAteMes(investimentoId: string, mesLimiteBusca: string) {
    const historico = saldosPorInvestimento.get(investimentoId);
    if (!historico) return null;
    let melhor: string | null = null;
    for (const mes of Array.from(historico.keys()).sort()) {
      if (mes <= mesLimiteBusca) melhor = mes;
      else break;
    }
    return melhor ? historico.get(melhor)! : null;
  }

  function valorExibidoInvestimento(inv: { id: string; valor_atual: number }) {
    if (!filtroAtivo || !mesLimite) return Number(inv.valor_atual);
    return saldoInvestimentoAteMes(inv.id, mesLimite) ?? 0;
  }

  // Mês atual no formato yyyy-MM, para pré-preencher o formulário
  const mesAtual = new Date().toISOString().slice(0, 7);

  // Resumo geral (posição atual = sem filtro, todo o histórico)
  const totalAtual     = investimentos.reduce((s, i) => s + Number(i.valor_atual), 0);
  const totalAportadoGeral  = movimentos.filter(m => m.tipo === "aporte").reduce((s, m) => s + Number(m.valor), 0);
  const totalResgatadoGeral = movimentos.filter(m => m.tipo === "resgate").reduce((s, m) => s + Number(m.valor), 0);
  const totalInvestidoGeral = totalAportadoGeral - totalResgatadoGeral;
  const rentTotal      = totalInvestidoGeral > 0 ? ((totalAtual - totalInvestidoGeral) / totalInvestidoGeral) * 100 : 0;

  // Movimentos filtrados pelo período selecionado — alimentam os 3 stat pills
  // abaixo (sem filtro = todo o histórico, igual ao comportamento de Movimentações)
  const movimentosPeriodo = movimentos.filter((m) => {
    if (sp.inicio && m.data < sp.inicio) return false;
    if (sp.fim && m.data > sp.fim) return false;
    return true;
  });
  const totalAportado  = movimentosPeriodo.filter(m => m.tipo === "aporte").reduce((s, m) => s + Number(m.valor), 0);
  const totalResgatado = movimentosPeriodo.filter(m => m.tipo === "resgate").reduce((s, m) => s + Number(m.valor), 0);
  const totalInvestido = totalAportado - totalResgatado;

  // Patrimônio no período: usa o saldo mensal agregado (mesma fonte do
  // gráfico de evolução) mais próximo do fim do intervalo selecionado, em vez
  // do valor atual "ao vivo" — assim o card reflete de fato a data filtrada.
  const saldoPeriodo = filtroAtivo && mesLimite ? (() => {
    let melhor: string | null = null;
    for (const mes of Array.from(saldosPorMes.keys()).sort()) {
      if (mes <= mesLimite) melhor = mes;
      else break;
    }
    return melhor ? saldosPorMes.get(melhor)! : null;
  })() : null;
  // Com filtro: sem saldo registrado até a data de corte = ainda não havia
  // patrimônio (0), nunca cai pro valor atual "ao vivo". Sem filtro: posição atual.
  const patrimonio = filtroAtivo ? (saldoPeriodo ?? 0) : totalAtual;

  // Investido acumulado até a data de corte (não só dentro da janela), pra a
  // rentabilidade do período continuar fazendo sentido.
  const movimentosAteCorte = dataCorte ? movimentos.filter((m) => m.data <= dataCorte) : movimentos;
  const aportadoAteCorte  = movimentosAteCorte.filter(m => m.tipo === "aporte").reduce((s, m) => s + Number(m.valor), 0);
  const resgatadoAteCorte = movimentosAteCorte.filter(m => m.tipo === "resgate").reduce((s, m) => s + Number(m.valor), 0);
  const investidoAteCorte = aportadoAteCorte - resgatadoAteCorte;

  const rentabilidade = filtroAtivo
    ? (investidoAteCorte > 0 ? ((patrimonio - investidoAteCorte) / investidoAteCorte) * 100 : 0)
    : rentTotal;
  const positivo = rentabilidade >= 0;

  // Distribuição da carteira: Renda Fixa x Renda Variável (respeita o período)
  const distribuicao = [
    { name: "Renda Fixa", value: investimentos.filter(i => i.tipo === "renda_fixa").reduce((s, i) => s + valorExibidoInvestimento(i), 0) },
    { name: "Renda Variável", value: investimentos.filter(i => i.tipo === "renda_variavel").reduce((s, i) => s + valorExibidoInvestimento(i), 0) },
  ].filter(d => d.value > 0);

  return (
<SplitLayout className="onfin-module-investimentos" top={<>
      {/* Hero: patrimônio + rentabilidade — reflete o período filtrado quando houver */}
      <div className="glass-card p-6 flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-ink-secondary">Patrimônio investido</div>
          <div className="num text-[32px] leading-tight font-semibold tracking-tight text-ink-primary mt-1.5">{currency(patrimonio)}</div>
          {filtroAtivo && (
            <div className="text-[11px] text-ink-tertiary mt-1">
              {saldoPeriodo !== null ? `Saldo registrado até ${dateBR(dataCorte!)}` : "Nenhum saldo registrado até este período"}
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] font-semibold text-ink-secondary">Rentabilidade</div>
          <div className={`num text-base font-semibold mt-1 ${positivo ? "text-[#8FCB5E]" : "text-[#f87171]"}`}>
            {positivo ? "+" : ""}{rentabilidade.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 [&>*]:min-w-0">
        <StatPill label="Total investido" value={currency(totalInvestido)} />
        <StatPill label="Total aportado" value={currency(totalAportado)} tone="green" />
        <StatPill label="Total resgatado" value={currency(totalResgatado)} tone="amber" />
      </div>

      {/* Filtro de período — mesmo estilo discreto de Movimentações: chips + popover */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto flex-1 no-scrollbar">
          {MESES_RAPIDOS.map(({ label, offset }) => {
            const r = monthRange(offset);
            const isActive = sp.inicio === r.inicio && sp.fim === r.fim;
            return (
              <a
                key={offset}
                href={`/investimentos?inicio=${r.inicio}&fim=${r.fim}`}
                className={`shrink-0 text-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all duration-200 border whitespace-nowrap ${
                  isActive
                    ? "bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]"
                    : "bg-transparent border-surface-border/50 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2/40"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>

        {(sp.inicio || sp.fim) && (
          <a
            href="/investimentos"
            title="Limpar filtro"
            className="shrink-0 w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-[#f87171] transition-colors"
          >
            ×
          </a>
        )}

        <details className="relative shrink-0">
          <summary className="list-none cursor-pointer w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
            <Filter className="h-3.5 w-3.5" />
          </summary>
          <form className="absolute right-0 top-10 z-20 w-64 p-3.5 rounded-xl bg-surface border border-surface-border shadow-navy space-y-2.5">
            <p className="text-[11px] font-semibold text-ink-tertiary">Período personalizado</p>
            <div className="flex items-center gap-1.5">
              <Input type="date" name="inicio" defaultValue={sp.inicio} className="h-11 flex-1 min-w-0 text-xs" />
              <span className="text-slate-600 text-[11px] shrink-0">até</span>
              <Input type="date" name="fim" defaultValue={sp.fim} className="h-11 flex-1 min-w-0 text-xs" />
            </div>
            <Button type="submit" variant="secondary" className="w-full h-8 text-xs">Aplicar</Button>
          </form>
        </details>
      </div>

</>} aside={<>
      {/* Investimento / Aporte-Resgate / Saldo mensal — botões lado a lado */}
      <InvestimentoQuickForms contas={contasList} investimentos={investimentosList} mesAtual={mesAtual} />

</>}>
      {/* Distribuição da carteira — Renda Fixa x Renda Variável */}
      <div className="onfin-module-two-col">
      {distribuicao.length > 0 && (
        <Card className="border-surface-border/60 p-4">
          <div className="mb-4 pb-3 border-b border-surface-border/50">
            <h2 className="text-[15px] font-semibold text-white">Distribuição da carteira</h2>
            <p className="text-xs text-ink-tertiary mt-1">Renda fixa x renda variável por valor atual</p>
          </div>
          <CategoryPie data={distribuicao} />
        </Card>
      )}

      {/* Gráfico de evolução do patrimônio — exige ao menos 2 meses registrados */}
      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">Evolução do patrimônio</h2>
          <p className="text-xs text-ink-tertiary mt-1">Saldo total registrado por mês</p>
        </div>
        {evolutionData.length < 2 ? (
          <div className="text-center py-8 px-2 border border-dashed border-surface-border/70 rounded-xl">
            <p className="text-slate-500 text-[13px] leading-relaxed">
              Registre o saldo de pelo menos 2 meses<br />para visualizar o gráfico de evolução.
            </p>
          </div>
        ) : (
          <InvestimentoEvolutionChart data={evolutionData} />
        )}
      </Card>

      </div>
      {/* Carteira */}
      <Card className="border-surface-border/60 p-4">
        <div className="mb-4 pb-3 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">Carteira</h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {investimentos.length} {investimentos.length === 1 ? "investimento cadastrado" : "investimentos cadastrados"}
          </p>
        </div>
        <div className="space-y-3">
          {investimentos.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-slate-300 mb-2">Nenhum investimento cadastrado</h3>
              <p className="text-slate-500 text-sm">Adicione seu primeiro investimento acima</p>
            </div>
          ) : (
            investimentos.map(inv => {
              const movInv = movimentos.filter(m => m.investimento_id === inv.id);
              const movInvExibidos = filtroAtivo && dataCorte ? movInv.filter(m => m.data <= dataCorte) : movInv;
              return (
                <InvestimentoAccordion
                  key={inv.id}
                  id={inv.id}
                  nome={inv.nome}
                  tipo={inv.tipo}
                  subcategoria={inv.subcategoria}
                  ticker={inv.ticker}
                  contaNome={inv.contas?.nome ?? null}
                  valorAtual={valorExibidoInvestimento(inv)}
                  movimentos={movInvExibidos}
                />
              );
            })
          )}
        </div>
      </Card>
    </SplitLayout>
  );
}
