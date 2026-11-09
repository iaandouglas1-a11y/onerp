import { Surface, AmountText } from "@/components/ui";
import { getFinancialOverview } from "@/lib/financialengine";
import ContasCartoesBody from "./ContasCartoesBody";

// Normaliza para centavos e evita que resíduos decimais do cálculo alterem a cor
// de um saldo que é exibido como R$ 0,00.
function normalizeZero(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export default async function ContasECartoesPage() {
  const items = await getFinancialOverview();

  const contas = items
    .filter((i) => i.tipo === "conta")
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: "conta" as const,
      ativo: c.ativo,
      logo_url: c.logo_url,
      saldo: normalizeZero(c.saldo),
    }));

  const cartoes = items
    .filter((i) => i.tipo === "cartao")
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      tipo: "cartao" as const,
      ativo: c.ativo,
      logo_url: c.logo_url,
      saldo: normalizeZero(c.saldo),
      limite: normalizeZero(c.limite || 0),
      usado: normalizeZero(c.usado || 0),
      disponivel: normalizeZero(c.disponivel || 0),
    }));

  const saldoConsolidado = normalizeZero(contas.reduce((s, c) => s + c.saldo, 0));

  return (
    <div className="onfin-desktop-page space-y-5 md:space-y-6">
      <Surface className="p-5">
        <p className="text-sm text-ink-secondary">Saldo consolidado</p>
        <AmountText value={saldoConsolidado} size="lg" />
      </Surface>

      <ContasCartoesBody contas={contas} cartoes={cartoes} />
    </div>
  );
}
