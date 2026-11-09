export function currency(value: number) {
  // Blinda contra valores ausentes/malformados vindos do banco (null, undefined,
  // string vazia) — em vez de exibir "NaN" ou quebrar a formatação, trata como 0.
  const n = Number(value);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number.isFinite(n) ? n : 0);
}

export function dateBR(value: string | null | undefined) {
  // Blinda contra data ausente/malformada (registros antigos, campo opcional
  // não preenchido, etc.) — sem isso, value.split(...) lançava uma exceção que
  // derrubava toda a renderização no servidor (Application error) para
  // qualquer tela que listasse esse registro.
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}
