"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui";

type Aba = "honorarios" | "clientes";

/** Gestão PJ — toggle superior alterna entre Honorários e Acessos de clientes.
 * As duas seções são renderizadas no servidor e só exibidas/ocultadas aqui. */
export default function GestaoPJBody({
  abaInicial,
  honorarios,
  clientes,
}: {
  abaInicial: Aba;
  honorarios: React.ReactNode;
  clientes: React.ReactNode;
}) {
  const [aba, setAba] = useState<Aba>(abaInicial);

  return (
    <div className="space-y-6">
      <SegmentedControl<Aba>
        options={[
          { label: "Honorários", value: "honorarios" },
          { label: "Acessos clientes", value: "clientes" },
        ]}
        value={aba}
        onChange={setAba}
      />
      <div className={aba === "honorarios" ? "" : "hidden"}>{honorarios}</div>
      <div className={aba === "clientes" ? "" : "hidden"}>{clientes}</div>
    </div>
  );
}
