import { deleteMovimentacao } from "@/app/(app)/actions";
import { SplitLayout } from "@/components/SplitLayout";
import { Card, Input, Select, Button, EmptyState, IconChip, AmountText, Surface } from "@/components/ui";
import { currency, dateBR } from "@/lib/format";
import { ANTECIPACAO_FATURA_PREFIX, isAntecipacaoFatura, isTransferencia } from "@/lib/finance";
import { getCartoesEFaturas, getCategorias, getContasWithMovs, getMovimentacoes } from "@/lib/queries";
import { Trash2, Filter, Inbox, X } from "lucide-react";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { clsx } from "clsx";
import FiltroDataPersist from "@/components/FiltroDataPersist";
import MovimentacaoQuickForms from "./MovimentacaoQuickForms";
import EditarMovimentacaoBtn from "./EditarMovimentacaoBtn";
import ExportarMovimentacoesBtn from "./ExportarMovimentacoesBtn";

const MESES_RAPIDOS = [
  { label: "Este mês", offset: 0 },
  { label: "Mês anterior", offset: -1 },
  { label: "2 meses atrás", offset: -2 },
];

const TIPO_TABS = [
  { label: "Todas", value: "" },
  { label: "Receitas", value: "receita" },
  { label: "Despesas", value: "despesa" },
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

function withParam(sp: Record<string, string | undefined>, key: string, value: string) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v && k !== key) params.set(k, v);
  }
  if (value) params.set(key, value);
  const qs = params.toString();
  return `/movimentacoes${qs ? `?${qs}` : ""}`;
}

export default async function MovimentacoesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [movs, categorias, contasData, cardsData] = await Promise.all([
    getMovimentacoes({ inicio: sp.inicio, fim: sp.fim, tipo: sp.tipo as any, categoriaId: sp.categoria, contaId: sp.conta }),
    getCategorias(),
    getContasWithMovs(),
    getCartoesEFaturas(),
  ]);

  const movsVisiveis = (movs as any[]).filter((m) => !(sp.tipo && isTransferencia(m)));
  const receitasTotal = movsVisiveis.filter(m => m.tipo === "receita" && !isTransferencia(m)).reduce((s, m) => s + Number(m.valor), 0);
  const despesasTotal = movsVisiveis.filter(m => m.tipo === "despesa" && !isTransferencia(m)).reduce((s, m) => s + Number(m.valor), 0);
  const exportRows = movsVisiveis.map((m: any) => ({
    id: String(m.id ?? ""),
    tipo: String(m.tipo ?? ""),
    valor: Number(m.valor ?? 0),
    data: String(m.data ?? ""),
    categoria: String(m.categorias?.nome ?? ""),
    banco: String(m.contas?.nome ?? ""),
    cartao: String(m.cartoes?.nome ?? ""),
    fatura: String(m.faturas?.data_vencimento ?? ""),
    status: String(m.status ?? ""),
    descricao: String(m.descricao ?? ""),
  }));

  // Apenas faturas em aberto podem receber novos lançamentos — faturas já pagas ficam de fora
  const contasAtivas = (contasData.contas as any[]).filter((c) => c.ativo !== false);
  const cartoesAtivos = (cardsData.cartoes as any[]).filter((c) => c.ativo !== false);
  const faturasEmAberto = (cardsData.faturas as any[]).filter((f) => !f.pago && cartoesAtivos.some((c) => c.id === f.cartao_id));

  // Agrupar por data (mais recente primeiro); dentro do dia: receitas antes de despesas
  const grupos = movsVisiveis.reduce((acc, m) => {
    const d = m.data;
    if (!acc[d]) acc[d] = [];
    acc[d].push(m);
    return acc;
  }, {} as Record<string, any[]>);
  const datas = Object.keys(grupos).sort((a, b) => b.localeCompare(a));
  datas.forEach(data => {
    grupos[data].sort((a: any, b: any) => {
      if (a.tipo !== b.tipo) return a.tipo === "receita" ? -1 : 1;
      if (isTransferencia(a) !== isTransferencia(b)) return isTransferencia(a) ? 1 : -1;
      return (a.categorias?.nome ?? "").localeCompare(b.categorias?.nome ?? "", "pt-BR");
    });
  });

  return (
<SplitLayout className="onfin-mov-layout" top={<>
      <FiltroDataPersist pagina="movimentacoes" basePath="/movimentacoes" inicio={sp.inicio} fim={sp.fim} />

      <div className="flex items-center justify-between px-1">
        <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight">Movimentações</h1>
      </div>

      {/* Tabs Todas/Receitas/Despesas via URL — sem JS necessário */}
      <div className="flex w-full lg:max-w-[480px] bg-surface border border-surface-border/60 rounded-xl p-1 gap-0.5">
        {TIPO_TABS.map((t) => {
          const active = (sp.tipo ?? "") === t.value;
          return (
            <a
              key={t.value}
              href={withParam(sp, "tipo", t.value)}
              className={clsx(
                "flex-1 text-center py-2 text-[12.5px] font-semibold rounded-xl transition-all duration-150",
                active ? "bg-[#5DA832] text-[#0A0A0A]" : "text-ink-secondary hover:text-ink-primary"
              )}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      {/* Stat pills do período filtrado */}
      <div className="grid grid-cols-2 gap-3">
        <div className="surface-2 bg-surface px-3.5 py-3 flex-1">
          <div className="text-[11px] font-semibold text-ink-secondary">Entradas</div>
          <AmountText value={receitasTotal} tone="green" size="lg" className="block mt-1" />
        </div>
        <div className="surface-2 bg-surface px-3.5 py-3 flex-1">
          <div className="text-[11px] font-semibold text-ink-secondary">Saídas</div>
          <AmountText value={despesasTotal} tone="red" size="lg" className="block mt-1" />
        </div>
      </div>

</>} aside={<>
      {/* Nova transação / Transferência — botões lado a lado, formulário só aparece ao clicar */}
      <div id="lancamento" className="scroll-mt-6">
        <MovimentacaoQuickForms
          categorias={categorias}
          contas={contasAtivas}
          cartoes={cartoesAtivos}
          faturas={faturasEmAberto}
          defaultTipo={sp.tipo}
        />
      </div>

</>}>
      {/* Filtros */}
      {/* Filtros — discreto: chips + ícone p/ período customizado e categoria ── */}
      <div id="filtros" className="onfin-filter-row scroll-mt-6">
        <div className="onfin-filter-scroll flex gap-1.5 no-scrollbar">
          {MESES_RAPIDOS.map(({ label, offset }) => {
            const r = monthRange(offset);
            const isActive = sp.inicio === r.inicio && sp.fim === r.fim;
            return (
              <a key={offset} href={`/movimentacoes?inicio=${r.inicio}&fim=${r.fim}`}
                className={clsx(
                  "shrink-0 text-center px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all duration-200 border whitespace-nowrap",
                  isActive
                    ? "bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]"
                    : "bg-transparent border-surface-border/50 text-ink-tertiary hover:text-ink-secondary hover:bg-surface-2/40"
                )}
              >
                {label}
              </a>
            );
          })}
        </div>

        {(sp.inicio || sp.fim || sp.tipo || sp.categoria || sp.conta) && (
          <a
            href="/movimentacoes"
            title="Limpar filtros"
            className="shrink-0 w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-[#f87171] transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </a>
        )}

        <form action="/movimentacoes" className="hidden lg:flex min-w-0 shrink-0 items-center gap-2">
          <input type="hidden" name="inicio" value={sp.inicio ?? ""} />
          <input type="hidden" name="fim" value={sp.fim ?? ""} />
          <input type="hidden" name="tipo" value={sp.tipo ?? ""} />
          <label className="sr-only" htmlFor="filtro-categoria">Categoria</label>
          <Select id="filtro-categoria" name="categoria" defaultValue={sp.categoria ?? ""} className="!w-[136px] !h-9 text-xs">
            <option value="">Categorias</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <label className="sr-only" htmlFor="filtro-conta">Conta</label>
          <Select id="filtro-conta" name="conta" defaultValue={sp.conta ?? ""} className="!w-[130px] !h-9 text-xs">
            <option value="">Contas</option>
            {(contasData.contas as any[]).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </Select>
          <Button type="submit" variant="secondary" className="!h-9 !min-h-9 !px-3 text-xs">Filtrar</Button>
        </form>

        <details className="relative shrink-0">
          <summary className="list-none cursor-pointer w-8 h-8 rounded-full bg-surface border border-surface-border/50 flex items-center justify-center text-ink-tertiary hover:text-ink-primary transition-colors">
            <Filter className="h-3.5 w-3.5" />
          </summary>
          <form className="absolute right-0 top-10 z-20 w-72 p-3.5 rounded-xl bg-surface border border-surface-border shadow-navy space-y-2.5">
            <p className="text-[11px] font-semibold text-ink-tertiary">Período personalizado</p>
            <div className="flex items-center gap-1.5">
              <Input type="date" name="inicio" defaultValue={sp.inicio} className="h-11 flex-1 min-w-0 text-xs" />
              <span className="text-slate-600 text-[11px] shrink-0">até</span>
              <Input type="date" name="fim" defaultValue={sp.fim} className="h-11 flex-1 min-w-0 text-xs" />
            </div>
            <input type="hidden" name="tipo" value={sp.tipo ?? ""} />
            <Select name="categoria" defaultValue={sp.categoria ?? ""} className="h-11 text-xs w-full">
              <option value="">Todas categorias</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
            <Select name="conta" defaultValue={sp.conta ?? ""} className="h-11 text-xs w-full">
              <option value="">Todos os bancos</option>
              {(contasData.contas as any[]).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
            <Button type="submit" variant="secondary" className="w-full h-8 text-xs">Aplicar</Button>
          </form>
        </details>
        <ExportarMovimentacoesBtn rows={exportRows} />
      </div>

      {/* Listagem agrupada por dia */}
      {movsVisiveis.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox className="h-12 w-12" />}
            title="Nenhuma movimentação encontrada"
            description="Adicione uma transação ou ajuste os filtros"
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {datas.map((data) => (
            <div key={data}>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[11px] font-semibold text-ink-tertiary">{dateBR(data)}</span>
                <span className="text-[11px] text-ink-tertiary">
                  {grupos[data].length} {grupos[data].length === 1 ? "lançamento" : "lançamentos"}
                </span>
              </div>
              <Surface padded={false} className="divide-y divide-surface-border/50">
                {grupos[data].map((m: any) => {
                  const transferencia = isTransferencia(m);
                  const CatIcon = getCategoryIcon(m.categorias?.nome || "", m.categorias?.icone);
                  return (
                    <div key={m.id} className="list-row group">
                      <IconChip icon={CatIcon} tone={transferencia ? "gray" : m.tipo === "receita" ? "green" : "red"} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold text-ink-primary truncate">
                          {transferencia ? "Transferência entre contas" : (m.categorias?.nome || "Sem categoria")}
                        </div>
                        <div className="text-[11.5px] text-ink-tertiary mt-0.5 truncate">
                          {isAntecipacaoFatura(m)
                            ? String(m.descricao).replace(ANTECIPACAO_FATURA_PREFIX, "Antecipação de fatura")
                            : (m.descricao || m.contas?.nome || m.cartoes?.nome || "—")}
                        </div>
                      </div>
                      <div className="ml-auto shrink-0 flex flex-col items-end gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        {transferencia ? <span className="num text-[14px] font-semibold text-ink-secondary">↔ {currency(Number(m.valor))}</span> : <AmountText value={m.tipo === "receita" ? Number(m.valor) : -Number(m.valor)} signed tone={m.tipo === "receita" ? "green" : "red"} />}
                        <div className="flex items-center gap-1">
                          <EditarMovimentacaoBtn
                            mov={m}
                            categorias={categorias}
                            contas={contasAtivas}
                            cartoes={cartoesAtivos}
                            faturas={
                              // Faturas em aberto + a fatura atual do lançamento (mesmo que já paga),
                              // pra não perder a referência ao editar um lançamento antigo.
                              faturasEmAberto.some((f) => f.id === m.fatura_id)
                                ? faturasEmAberto
                                : [...faturasEmAberto, ...cardsData.faturas.filter((f: any) => f.id === m.fatura_id)]
                            }
                          />
                          <form action={deleteMovimentacao}>
                            <input type="hidden" name="id" value={m.id} />
                            <button className="p-1.5 text-slate-600 hover:text-[#f87171] rounded-xl transition-colors" title="Excluir">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Surface>
            </div>
          ))}
        </div>
      )}
    </SplitLayout>
  );
}
