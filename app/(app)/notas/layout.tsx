import { getNotas } from "@/lib/queries";
import NotasBody from "./NotasBody";
import NotasShell from "./NotasShell";

/** Notas — no desktop a lista fica fixa à esquerda e o editor abre à direita
 * (master-detail). No mobile continua em duas telas: lista → nota. */
export default async function NotasLayout({ children }: { children: React.ReactNode }) {
  const notas = await getNotas();

  return (
    <div className="space-y-6">
      <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight px-1">Notas</h1>
      <NotasShell list={<NotasBody notas={notas} />}>{children}</NotasShell>
    </div>
  );
}
