"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  pagina: string;   // chave única por página ex: "dashboard" | "movimentacoes"
  inicio?: string;
  fim?: string;
  basePath: string; // ex: "/dashboard" | "/movimentacoes"
  extraParams?: string; // ex: "&tipo=despesa" — outros params a preservar
}

export default function FiltroDataPersist({ pagina, inicio, fim, basePath, extraParams = "" }: Props) {
  const router = useRouter();
  const keyInicio = `filtro_${pagina}_inicio`;
  const keyFim    = `filtro_${pagina}_fim`;

  useEffect(() => {
    if (inicio && fim) {
      localStorage.setItem(keyInicio, inicio);
      localStorage.setItem(keyFim, fim);
    } else {
      const savedInicio = localStorage.getItem(keyInicio);
      const savedFim    = localStorage.getItem(keyFim);
      if (savedInicio && savedFim) {
        router.replace(`${basePath}?inicio=${savedInicio}&fim=${savedFim}${extraParams}`);
      }
    }
  }, [inicio, fim]);

  return null;
}
