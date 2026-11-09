"use client";

import { SplitLayout } from "@/components/SplitLayout";
import { useState } from "react";
import { Plus, X, Users } from "lucide-react";
import { Card, FormGroup, Input, EmptyState } from "@/components/ui";
import { saveCliente, deleteCliente, setClienteAtivo } from "@/app/(app)/actions_clientes";
import type { Cliente } from "@/types/database";
import ClienteRow from "./ClienteRow";

interface Props {
  ativos: Cliente[];
  inativos: Cliente[];
}

export default function ClientesBody({ ativos, inativos }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [aba, setAba] = useState<"ativos" | "inativos">("ativos");

  const lista = aba === "ativos" ? ativos : inativos;
  const titulo = aba === "ativos" ? "Clientes ativos" : "Clientes inativos";
  const count = lista.length;

  return (
<SplitLayout className="onfin-module-clientes" aside={<>
      {/* Botão — Novo cliente (mesmo mecanismo de toggle de Categorias/Honorários) */}
      <button
        type="button"
        onClick={() => setPainelAberto((v) => !v)}
        className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${
          painelAberto
            ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]"
            : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
        }`}
      >
        <Plus className="h-3.5 w-3.5" />
        Novo cliente
      </button>

      {painelAberto && (
        <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs">
              <Plus className="h-4 w-4" />
              <span>Novo cliente</span>
            </div>
            <button
              type="button"
              onClick={() => setPainelAberto(false)}
              className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form
            action={async (formData) => {
              await saveCliente(formData);
              setPainelAberto(false);
            }}
            className="space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <FormGroup label="Nome" className="col-span-2">
                <Input name="nome" required placeholder="Nome completo" className="text-sm" />
              </FormGroup>
              <FormGroup label="CPF">
                <Input name="cpf" placeholder="000.000.000-00" className="text-sm" />
              </FormGroup>
              <FormGroup label="CNPJ">
                <Input name="cnpj" placeholder="00.000.000/0000-00" className="text-sm" />
              </FormGroup>
              <FormGroup label="Senha Gov" className="col-span-2">
                <Input name="senha_gov" type="password" placeholder="••••••••" className="text-sm" />
              </FormGroup>
            </div>

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Cadastrar cliente
            </button>
          </form>
        </div>
      )}

</>}>
      {/* Toggle — Ativos / Inativos (mesmo mecanismo de Em aberto/Liquidadas em Dívidas) */}
      <div className="flex bg-surface rounded-xl p-1">
        <button
          type="button"
          onClick={() => setAba("ativos")}
          className={`flex-1 text-center py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
            aba === "ativos" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary hover:text-ink-secondary"
          }`}
        >
          Ativos ({ativos.length})
        </button>
        <button
          type="button"
          onClick={() => setAba("inativos")}
          className={`flex-1 text-center py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
            aba === "inativos" ? "bg-[#5DA832]/20 text-[#8FCB5E]" : "text-ink-tertiary hover:text-ink-secondary"
          }`}
        >
          Inativos ({inativos.length})
        </button>
      </div>

      {/* Card único — mesmo padrão visual de "Dívidas em aberto" */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-surface-border/50">
          <h2 className="text-[15px] font-semibold text-white">{titulo}</h2>
          <p className="text-xs text-ink-tertiary mt-1">
            {count} {count === 1 ? "cliente" : "clientes"}
          </p>
        </div>

        {count === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title={aba === "ativos" ? "Nenhum cliente ativo" : "Nenhum cliente inativo"}
            description={
              aba === "ativos"
                ? "Cadastre seu primeiro cliente para começar"
                : "Clientes desativados aparecem aqui"
            }
          />
        ) : (
          <div>
            {lista.map((cliente) => (
              <ClienteRow
                key={cliente.id}
                cliente={cliente}
                deleteCliente={deleteCliente}
                setClienteAtivo={setClienteAtivo}
                saveCliente={saveCliente}
              />
            ))}
          </div>
        )}
      </Card>
    </SplitLayout>
  );
}
