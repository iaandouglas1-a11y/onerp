import { getCategorias } from "@/lib/queries";
import CategoriasBody from "./CategoriasBody";

export default async function CategoriasPage() {
  const categorias = await getCategorias();

  const despesas = categorias.filter((c) => c.tipo?.toLowerCase() === "despesa");
  const receitas = categorias.filter((c) => c.tipo?.toLowerCase() === "receita");

  return (
    <div className="onfin-desktop-page space-y-5 md:space-y-6">
      <CategoriasBody despesas={despesas} receitas={receitas} />
    </div>
  );
}
