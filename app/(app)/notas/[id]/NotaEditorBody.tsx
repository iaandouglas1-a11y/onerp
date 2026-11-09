"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft, Pin, Trash2, Archive, ArchiveRestore,
  Plus, X, Check, Square, CheckSquare, Type,
} from "lucide-react";
import { saveNota, deleteNota, togglePinNota, arquivarNota } from "@/app/(app)/actions_notas";
import { dateBR } from "@/lib/format";
import type { Nota, NotaItem } from "@/types/database";

type Bloco = NotaItem;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Detecta URLs (http/https ou www.) ignorando pontuação final ("...site.com.")
const URL_REGEX = /(https?:\/\/[^\s]*[^\s.,;:!?)]|www\.[^\s]*[^\s.,;:!?)])/g;

function temLink(texto: string) {
  return new RegExp(URL_REGEX.source).test(texto);
}

// Quebra o texto em pedaços; os de índice ímpar são URLs (grupo de captura do split).
function renderComLinks(texto: string) {
  return texto.split(URL_REGEX).map((parte, i) => {
    if (i % 2 === 1) {
      const href = parte.startsWith("http") ? parte : `https://${parte}`;
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#8FCB5E] underline underline-offset-2"
        >
          {parte}
        </a>
      );
    }
    return <span key={i}>{parte}</span>;
  });
}

// Migra o formato antigo (conteúdo solto + checklist separada) para o corpo
// único de blocos — mantém a ordem: texto livre primeiro, depois os itens.
function blocosIniciais(nota: Nota): Bloco[] {
  const brutos = (nota.itens ?? []) as any[];
  const jaEhModeloNovo = brutos.some((b) => b && typeof b.tipo === "string");
  if (jaEhModeloNovo) return brutos as Bloco[];

  const blocos: Bloco[] = [];
  if (nota.conteudo?.trim()) {
    blocos.push({ id: uid(), tipo: "texto", texto: nota.conteudo, concluido: false });
  }
  for (const it of brutos) {
    if (it && typeof it.texto === "string") {
      blocos.push({ id: it.id ?? uid(), tipo: "item", texto: it.texto, concluido: Boolean(it.concluido) });
    }
  }
  return blocos;
}

export default function NotaEditorBody({ nota }: { nota: Nota }) {
  const [titulo, setTitulo] = useState(nota.titulo);
  const [blocos, setBlocos] = useState<Bloco[]>(() => blocosIniciais(nota));
  const [sujo, setSujo] = useState(false);
  const [salvando, startTransition] = useTransition();
  const [focoPendente, setFocoPendente] = useState<string | null>(null);
  // Bloco em edição: linhas com link só viram <input> editável quando estão
  // em foco; fora disso mostram o texto numa linha só, com o link clicável.
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!focoPendente) return;
    inputsRef.current[focoPendente]?.focus();
    setFocoPendente(null);
  }, [focoPendente]);

  function focar(id: string) {
    setEditandoId(id);
    setFocoPendente(id);
  }

  function salvar(nextTitulo = titulo, nextBlocos = blocos, feedback = false) {
    const fd = new FormData();
    fd.set("id", nota.id);
    fd.set("titulo", nextTitulo);
    fd.set("itens", JSON.stringify(nextBlocos));
    startTransition(async () => {
      await saveNota(fd);
      setSujo(false);
      if (feedback) toast.success("Nota salva com sucesso");
    });
  }

  function atualizarTexto(id: string, texto: string) {
    setBlocos((prev) => prev.map((b) => (b.id === id ? { ...b, texto } : b)));
    setSujo(true);
  }

  function alternarConcluido(id: string) {
    const next = blocos.map((b) => (b.id === id ? { ...b, concluido: !b.concluido } : b));
    setBlocos(next);
    salvar(titulo, next);
  }

  // Insere um novo bloco logo após o atual (Enter) e foca nele — repete o
  // tipo da linha de origem, exatamente como no app de Notas do iPhone.
  function inserirApos(id: string, tipo: "texto" | "item") {
    const novo: Bloco = { id: uid(), tipo, texto: "", concluido: false };
    setBlocos((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, novo);
      return next;
    });
    focar(novo.id);
  }

  function adicionarBloco(tipo: "texto" | "item") {
    const novo: Bloco = { id: uid(), tipo, texto: "", concluido: false };
    setBlocos((prev) => [...prev, novo]);
    focar(novo.id);
  }

  function removerBloco(id: string) {
    const next = blocos.filter((b) => b.id !== id);
    setBlocos(next);
    salvar(titulo, next);
  }

  // Backspace numa linha vazia remove o bloco e volta o foco pra linha
  // anterior, sem round-trip ao servidor (o bloco nunca chegou a ser salvo).
  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>, bloco: Bloco, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      inserirApos(bloco.id, bloco.tipo || "item");
    } else if (e.key === "Backspace" && bloco.texto === "" && index > 0) {
      e.preventDefault();
      const anterior = blocos[index - 1];
      setBlocos((prev) => prev.filter((b) => b.id !== bloco.id));
      focar(anterior.id);
    }
  }

  const classeTexto = (bloco: Bloco) =>
    `flex-1 min-w-0 bg-transparent text-[13.5px] ${
      bloco.concluido ? "text-slate-500 line-through" : "text-white"
    }`;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header — mesmo padrão das demais páginas (título 22px em negrito,
          alinhado com px-1), com voltar à esquerda e ações à direita */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Link
            href="/notas"
            aria-label="Voltar para notas"
            className="md:hidden shrink-0 flex items-center justify-center text-ink-secondary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <input
            value={titulo}
            onChange={(e) => { setTitulo(e.target.value); setSujo(true); }}
            onBlur={() => sujo && salvar()}
            placeholder="Nova nota"
            aria-label="Nome da lista"
            className="min-w-0 flex-1 bg-transparent text-[22px] font-semibold text-ink-primary tracking-tight placeholder:text-slate-600 outline-none border-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <form action={togglePinNota}>
            <input type="hidden" name="id" value={nota.id} />
            <input type="hidden" name="fixada" value={String(nota.fixada)} />
            <button
              type="submit"
              title={nota.fixada ? "Desafixar" : "Fixar"}
              className={`w-9 h-11 rounded-xl border flex items-center justify-center transition-colors ${
                nota.fixada
                  ? "bg-[#5DA832]/15 border-[#5DA832]/35 text-[#8FCB5E]"
                  : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"
              }`}
            >
              <Pin className="h-4 w-4" />
            </button>
          </form>

          <form action={arquivarNota}>
            <input type="hidden" name="id" value={nota.id} />
            <input type="hidden" name="status" value={nota.status} />
            <button
              type="submit"
              title={nota.status === "ativa" ? "Arquivar" : "Restaurar"}
              className="w-9 h-11 rounded-xl bg-surface border border-surface-border/60 flex items-center justify-center text-ink-secondary hover:text-amber-400 transition-colors"
            >
              {nota.status === "ativa" ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
            </button>
          </form>

          <form action={deleteNota}>
            <input type="hidden" name="id" value={nota.id} />
            <button
              type="submit"
              title="Excluir"
              className="w-9 h-11 rounded-xl bg-surface border border-surface-border/60 flex items-center justify-center text-ink-secondary hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <p className="text-[11px] text-ink-tertiary px-1">
        {dateBR((nota.updated_at || nota.created_at)?.slice(0, 10))}
        {salvando && " · salvando..."}
      </p>

      {/* Corpo único — texto livre e checklist na mesma sequência, sem
          separação entre "conteúdo" e "itens" */}
      <div className="space-y-0.5 -mt-1">
        {blocos.map((bloco, index) => {
          const mostrarLink = temLink(bloco.texto) && editandoId !== bloco.id;

          return (
            <div key={bloco.id} className={`flex items-center py-1 group ${bloco.tipo === "texto" ? "" : "gap-2.5"}`}>
              {bloco.tipo !== "texto" && (
                <button
                  type="button"
                  onClick={() => alternarConcluido(bloco.id)}
                  className={bloco.concluido ? "text-[#5DA832] shrink-0" : "text-slate-600 hover:text-slate-400 shrink-0"}
                >
                  {bloco.concluido ? <CheckSquare className="h-[18px] w-[18px]" /> : <Square className="h-[18px] w-[18px]" />}
                </button>
              )}

              {mostrarLink ? (
                // Modo leitura: uma linha só, link clicável, reticências no excesso.
                // Tocar fora do link entra no modo edição.
                <div
                  onClick={() => focar(bloco.id)}
                  className={`${classeTexto(bloco)} truncate whitespace-nowrap cursor-text`}
                >
                  {renderComLinks(bloco.texto)}
                </div>
              ) : (
                <input
                  ref={(el) => { inputsRef.current[bloco.id] = el; }}
                  value={bloco.texto}
                  onChange={(e) => atualizarTexto(bloco.id, e.target.value)}
                  onFocus={() => setEditandoId(bloco.id)}
                  onBlur={() => {
                    setEditandoId((atual) => (atual === bloco.id ? null : atual));
                    if (sujo) salvar();
                  }}
                  onKeyDown={(e) => aoTeclar(e, bloco, index)}
                  placeholder={bloco.tipo === "texto" ? "" : "Item"}
                  className={`${classeTexto(bloco)} outline-none border-none placeholder:text-slate-600`}
                />
              )}

              <button
                type="button"
                onClick={() => removerBloco(bloco.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 transition-opacity shrink-0 ml-2.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* Continuar a nota — texto ou novo item, sempre ao final do mesmo fluxo */}
        <div className="flex items-center gap-3 pt-1.5">
          <button
            type="button"
            onClick={() => adicionarBloco("texto")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-tertiary hover:text-ink-primary transition-colors"
          >
            <Type className="h-3.5 w-3.5" />
            Texto
          </button>
          <button
            type="button"
            onClick={() => adicionarBloco("item")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-tertiary hover:text-ink-primary transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Item
          </button>
        </div>
      </div>

      <div className="pt-3 border-t border-surface-border/40 flex justify-end">
        <button
          type="button"
          onClick={() => salvar(titulo, blocos, true)}
          disabled={salvando}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] text-xs font-semibold transition-all duration-200"
        >
          <Check className="h-3.5 w-3.5" />
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
