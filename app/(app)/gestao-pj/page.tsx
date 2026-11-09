import HonorariosSection from "../honorarios/HonorariosSection";
import ClientesSection from "../clientes/ClientesSection";
import GestaoPJBody from "./GestaoPJBody";

export default async function GestaoPJPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const abaInicial = sp.aba === "clientes" ? "clientes" : "honorarios";

  return (
    <div className="onfin-desktop-page space-y-5 md:space-y-6">
      <h1 className="hidden md:block text-[22px] font-semibold text-ink-primary tracking-tight px-1">Gestão PJ</h1>
      <GestaoPJBody
        abaInicial={abaInicial}
        honorarios={<HonorariosSection />}
        clientes={<ClientesSection />}
      />
    </div>
  );
}
