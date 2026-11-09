"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import * as XLSX from "xlsx";

type ExportMovimentacao = {
  id: string;
  tipo: string;
  valor: number | string;
  data: string;
  categoria: string;
  banco: string;
  cartao: string;
  fatura: string;
  status: string;
  descricao: string;
};

export default function ExportarMovimentacoesBtn({ rows }: { rows: ExportMovimentacao[] }) {
  const [exportando, setExportando] = useState(false);

  function exportar() {
    if (exportando) return;
    setExportando(true);

    try {
      const exportRows = rows.map((row) => ({
        ID: row.id,
        Tipo: row.tipo,
        Valor: Number(row.valor),
        Data: row.data,
        Categoria: row.categoria,
        Banco: row.banco,
        Cartão: row.cartao,
        Fatura: row.fatura,
        Status: row.status,
        Descrição: row.descricao,
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportRows, {
        header: ["Tipo", "Valor", "Data", "Categoria", "Banco", "Cartão", "Fatura", "Status", "Descrição"],
      });
      worksheet["!cols"] = [
        { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 24 },
        { wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 48 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Movimentações");
      XLSX.writeFile(workbook, `movimentacoes-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExportando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={exportando}
      title="Exportar movimentações filtradas"
      className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-surface-border/50 bg-surface px-3 text-[11px] font-semibold text-ink-tertiary transition-colors hover:text-ink-primary disabled:cursor-wait disabled:opacity-60"
    >
      {exportando ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">Exportar</span>
    </button>
  );
}
