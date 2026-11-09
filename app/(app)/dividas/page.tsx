import { getDividas, getCategorias, getContasWithMovs } from "@/lib/queries";
import { currency } from "@/lib/format";
import DividasBody from "./DividasBody";

export default async function DividasPage() {
  const [{ dividas, pagamentos }, { contas }, categorias] = await Promise.all([
    getDividas(),
    getContasWithMovs(),
    getCategorias(),
  ]);

  const contasList = contas.map((c) => ({ id: c.id, nome: c.nome }));

  // Resumo
  const totalDevido = dividas.reduce((s, d) => s + Number(d.valor), 0);
  const totalPago = pagamentos.filter(p => p.tipo === "realizado").reduce((s, p) => s + Number(p.valor), 0);
  const saldoAtual = totalDevido - totalPago;

  // Separação em abas
  const abertas = dividas.filter(d => d.situacao !== "liquidado");
  const liquidadas = dividas.filter(d => d.situacao === "liquidado");

  // Progresso de pagamento por dívida
  function progressoDivida(dividaId: string, valorTotal: number) {
    const pagos = pagamentos
      .filter((p) => (p as any).divida_id === dividaId && p.tipo === "realizado")
      .reduce((s, p) => s + Number(p.valor), 0);
    const pct = valorTotal > 0 ? Math.min(100, (pagos / valorTotal) * 100) : 0;
    return { pagos, pct };
  }

  // Prepara dados das dívidas com progresso
  const dividasAbertas = abertas.map(d => ({
    ...d,
    categoriaNome: categorias.find(c => c.id === d.categoria_id)?.nome,
    ...progressoDivida(d.id, Number(d.valor)),
  }));

  const dividasLiquidadas = liquidadas.map(d => ({
    ...d,
    categoriaNome: categorias.find(c => c.id === d.categoria_id)?.nome,
    ...progressoDivida(d.id, Number(d.valor)),
  }));

  // Fluxo de pagamentos, mais recentes primeiro
  const fluxo = [...pagamentos].sort((a, b) => (b.data || "").localeCompare(a.data || ""));

  return (
    <div className="onfin-desktop-page space-y-5 md:space-y-6">
      <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight px-1">Dívidas</h1>

      <DividasBody
        totalDevido={totalDevido}
        totalPago={totalPago}
        saldoAtual={saldoAtual}
        dividasAbertas={dividasAbertas}
        dividasLiquidadas={dividasLiquidadas}
        fluxo={fluxo}
        categorias={categorias}
        contas={contasList}
      />
    </div>
  );
}
