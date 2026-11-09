import { getHonorarios, getContasWithMovs } from "@/lib/queries";
import { currency, dateBR } from "@/lib/format";
import HonorariosBody from "./HonorariosBody";

function formatCompetencia(competencia: string) {
  const [ano, mes] = competencia.slice(0, 7).split("-");
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${nomes[Number(mes) - 1]}/${ano}`;
}

export default async function HonorariosSection() {
  const [{ honorarios, clientes }, contasData] = await Promise.all([
    getHonorarios(),
    getContasWithMovs(),
  ]);

  const contas = contasData.contas.map((c) => ({ id: c.id, nome: c.nome }));
  const clientesAtivos = clientes.filter((c: any) => c.ativo !== false);

  // Data de hoje no fuso de Brasília (toISOString usa UTC e, depois das 21h, já cai no dia seguinte)
  const hojeStr = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const mesAtual = hojeStr.slice(0, 7);

  // Resumo do mês corrente (por competência)
  const doMes = honorarios.filter((h) => h.competencia.slice(0, 7) === mesAtual);
  const totalMes = doMes.reduce((s, h) => s + Number(h.valor), 0);
  const recebidoMes = doMes.filter((h) => h.pago).reduce((s, h) => s + Number(h.valor), 0);
  const pendenteMes = totalMes - recebidoMes;

  // Atrasados (qualquer competência, vencimento passado e não pago)
  const atrasados = honorarios.filter((h) => !h.pago && h.vencimento < hojeStr);
  const totalAtrasado = atrasados.reduce((s, h) => s + Number(h.valor), 0);

  // Prepara lista de honorários com infos do cliente
  const honorariosPreparados = honorarios.map((h) => {
    const clienteInfo = clientes.find((c) => c.id === h.cliente_id);
    const isAtrasado = !h.pago && h.vencimento < hojeStr;
    const isPendente = !h.pago && h.vencimento >= hojeStr;

    return {
      ...h,
      clienteNome: clienteInfo?.nome ?? "Cliente removido",
      competenciaLabel: formatCompetencia(h.competencia),
      vencimentoLabel: formatCompetencia(h.vencimento),
      isAtrasado,
      isPendente,
      status: h.pago ? "pago" : isAtrasado ? "atrasado" : "pendente",
    };
  });

  // Ordena: atrasados primeiro, depois pendentes, depois pagos
  const ordenados = [...honorariosPreparados].sort((a, b) => {
    const statusOrder = { atrasado: 0, pendente: 1, pago: 2 };
    const orderA = statusOrder[a.status as keyof typeof statusOrder];
    const orderB = statusOrder[b.status as keyof typeof statusOrder];
    if (orderA !== orderB) return orderA - orderB;
    return a.vencimento.localeCompare(b.vencimento);
  });

  return (
    <div className="space-y-6">
      <HonorariosBody
        totalMes={totalMes}
        recebidoMes={recebidoMes}
        pendenteMes={pendenteMes}
        totalAtrasado={totalAtrasado}
        clientes={clientes}
        clientesAtivos={clientesAtivos}
        honorarios={ordenados}
        mesAtualValue={mesAtual}
        contas={contas}
      />
    </div>
  );
}
