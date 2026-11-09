import { invoiceAnticipated, invoiceRemaining, invoiceTotal, isAntecipacaoFatura } from "@/lib/finance";
import { getCartoesEFaturas, getContasWithMovs, getCategorias } from "@/lib/queries";
import FaturasBody from "./FaturasBody";

export default async function FaturasPage() {
  const [{ cartoes, faturas, movimentacoes }, contasData, categorias] = await Promise.all([
    getCartoesEFaturas(),
    getContasWithMovs(),
    getCategorias(),
  ]);

  const contas = contasData.contas.map((c) => ({
    id: c.id,
    nome: c.nome,
  }));

  const cartoesResumo = (cartoes as any[]).map((c) => ({ id: c.id, nome: c.nome }));
  const faturasResumo = (faturas as any[]).map((f) => ({ id: f.id, data_vencimento: f.data_vencimento }));

  const today = new Date();

  const faturasPreparadas = (faturas as any[]).map((f) => {
    const card = (cartoes as any[]).find((c) => c.id === f.cartao_id);
    const expenses = (movimentacoes as any[]).filter((m) => m.fatura_id === f.id && !isAntecipacaoFatura(m));
    const total = invoiceTotal(f.id, movimentacoes);
    const antecipado = invoiceAnticipated(f.id, movimentacoes);
    const restante = invoiceRemaining(f.id, movimentacoes);

    const pago = f.pago === true;
    const venc = new Date(f.data_vencimento);
    const isOverdue = venc < today && !pago;
    const isDue = !pago && Math.abs(venc.getTime() - today.getTime()) < 7 * 24 * 60 * 60 * 1000;

    return {
      faturaId: f.id,
      cartaoId: f.cartao_id,
      cartaoNome: card?.nome ?? "Cartão",
      cartaoLogo: card?.logo_url ?? null,
      dataFechamento: f.data_fechamento,
      dataVencimento: f.data_vencimento,
      pago,
      pagoEm: f.pago_em ?? null,
      observacao: f.observacao ?? null,
      total,
      antecipado,
      restante,
      isOverdue,
      isDue,
      expenses,
    };
  });

  const faturasAbertas = faturasPreparadas.filter((f) => !f.pago);
  const faturasPagas = faturasPreparadas.filter((f) => f.pago);

  return (
    <div className="onfin-desktop-page space-y-5 md:space-y-6">
      <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight px-1">Faturas</h1>

      <FaturasBody
        cartoes={cartoesResumo}
        faturasAbertas={faturasAbertas}
        faturasPagas={faturasPagas}
        contas={contas}
        categorias={categorias}
        faturasResumo={faturasResumo}
      />
    </div>
  );
}
