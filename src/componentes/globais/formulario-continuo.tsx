
'use client';

import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { mensagemErroPublica, MENSAGENS } from './mensagens';

type RetornoSalvamento =
  | {
      sucesso?: boolean;
      mensagem?: string;
      id?: string | null;
    }
  | undefined;

type AcaoSalvamento = (
  dados: FormData
) => Promise<RetornoSalvamento>;

type Propriedades = {
  acao: AcaoSalvamento;
  children: ReactNode;
  className?: string;

  /** Rota de origem; após editar, retornar à listagem. */
  rotaNovoAposEdicao?: string;

  /** Chamado após limpar o DOM para zerar campos React controlados. */
  aoLimpar?: () => void;

  /** Ações pontuais não representam inclusão sequencial. */
  modo?: 'cadastro' | 'edicao' | 'acao';

  /** Campos de contexto mantidos entre inclusões. */
  manterCampos?: string[];

  /** Mantém o cliente selecionado no filtro da listagem. */
  focarClienteAposSalvar?: boolean;
};

/**
 * Política de formulários On ERP:
 *
 * - Cadastro: salvar sem navegar, exibir sucesso e permitir novo registro.
 * - Edição: salvar e retornar à visualização de origem quando houver rota.
 * - Erros: manter os dados preenchidos, sem fechar a janela.
 * - Ações pontuais: confirmar sem redefinir o formulário.
 * - Contexto: preservar cliente, competência e seletores definidos.
 */
export function FormularioContinuo({
  acao,
  children,
  className,
  rotaNovoAposEdicao,
  aoLimpar,
  modo = 'cadastro',
  manterCampos = [],
  focarClienteAposSalvar = false,
}: Propriedades) {
  const referencia = useRef<HTMLFormElement>(null);
  const envioEmCurso = useRef(false);

  const [executando, iniciarTransicao] = useTransition();
  const [mensagem, definirMensagem] = useState('');
  const [erro, definirErro] = useState('');

  const roteador = useRouter();

  function limparCampos(formulario: HTMLFormElement) {
    // Captura o contexto ANTES do reset.
    // select.reset() retorna ao defaultValue e poderia perder
    // o cliente escolhido no último cadastro.

    const contexto = new Set([
      'cliente_id',
      'cliente',
      'competencia',
      'conta_financeira_id',
      ...manterCampos,
    ]);

    const valores = new Map<string, string>();

    for (const controle of Array.from(formulario.elements)) {
      if (
        !(
          controle instanceof HTMLInputElement ||
          controle instanceof HTMLSelectElement ||
          controle instanceof HTMLTextAreaElement
        )
      ) {
        continue;
      }

      if (
        controle.name &&
        (
          contexto.has(controle.name) ||
          (
            controle instanceof HTMLInputElement &&
            controle.type === 'hidden'
          )
        )
      ) {
        valores.set(controle.name, controle.value);
      }
    }

    formulario.reset();

    for (const controle of Array.from(formulario.elements)) {
      if (
        !(
          controle instanceof HTMLInputElement ||
          controle instanceof HTMLTextAreaElement ||
          controle instanceof HTMLSelectElement
        )
      ) {
        continue;
      }

      if (!controle.name) continue;

      if (valores.has(controle.name)) {
        controle.value = valores.get(controle.name)!;
      } else if (
        controle instanceof HTMLInputElement &&
        ![
          'hidden',
          'submit',
          'button',
          'checkbox',
          'radio',
          'file',
        ].includes(controle.type)
      ) {
        controle.value = '';
      } else if (controle instanceof HTMLTextAreaElement) {
        controle.value = '';
      }
    }

    aoLimpar?.();

    // Evita deslocar o foco para campos invisíveis ou de contexto.
    const primeiro = formulario.querySelector<HTMLInputElement>(
      'input:not([type=hidden]):not([disabled]):not([readonly]),textarea:not([disabled])'
    );

    primeiro?.focus({ preventScroll: true });
  }

  function destinoAposEdicao(
    rota: string,
    clienteId?: string
  ) {
    const destino = new URL(
      rota,
      'https://on-erp.local'
    );

    if (destino.pathname === window.location.pathname) {
      const atuais = new URLSearchParams(
        window.location.search
      );

      for (const [chave, valor] of destino.searchParams) {
        atuais.set(chave, valor);
      }

      destino.search = atuais.toString();
    }

    if (focarClienteAposSalvar && clienteId) {
      destino.searchParams.set('cliente', clienteId);
    }

    [
      'novo',
      'nova',
      'editar',
      'modal',
      'id',
      'excluir',
      'ajustar',
    ].forEach((chave) => {
      destino.searchParams.delete(chave);
    });

    return destino.pathname + destino.search;
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (executando || envioEmCurso.current) return;

    envioEmCurso.current = true;

    const formulario = evento.currentTarget;

    // Captura os dados antes de atualizar o estado ou limpar campos.
    const dados = new FormData(formulario);

    definirErro('');
    definirMensagem('');

    iniciarTransicao(async () => {
      try {
        const retorno = await acao(dados);

        if (retorno && retorno.sucesso === false) {
          throw new Error(
            retorno.mensagem || 'Não foi possível salvar.'
          );
        }

        if (
          modo === 'edicao' &&
          rotaNovoAposEdicao
        ) {
          roteador.replace(
            destinoAposEdicao(
              rotaNovoAposEdicao,
              String(dados.get('cliente_id') || '')
            )
          );

          roteador.refresh();
          return;
        }

        const clienteSalvo = String(
          dados.get('cliente_id') || ''
        ).trim();

        if (modo === 'cadastro') {
          limparCampos(formulario);
        }

        if (
          focarClienteAposSalvar &&
          clienteSalvo
        ) {
          const novos = new URLSearchParams(
            window.location.search
          );

          novos.set('cliente', clienteSalvo);

          roteador.replace(
            `${window.location.pathname}?${novos.toString()}`,
            { scroll: false }
          );
        }

        formulario.dispatchEvent(
          new CustomEvent('onerp:salvo', {
            bubbles: true,
          })
        );

        definirMensagem(
          retorno?.mensagem ||
            (
              modo === 'edicao'
                ? MENSAGENS.edicao
                : MENSAGENS.cadastro
            )
        );

        if (
          !focarClienteAposSalvar ||
          !clienteSalvo
        ) {
          roteador.refresh();
        }
      } catch (falha) {
        definirErro(
          mensagemErroPublica(
            falha,
            MENSAGENS.falhaSalvamento
          )
        );
      } finally {
        envioEmCurso.current = false;
      }
    });
  }

  return (
    <form
      ref={referencia}
      onSubmit={enviar}
      className={className}
      aria-busy={executando}
      data-salvando={executando ? 'true' : 'false'}
    >
      {children}

      {erro && (
        <div
          className="mensagem erro formulario-retorno"
          role="alert"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          className="mensagem sucesso formulario-retorno"
          role="status"
        >
          {mensagem}
        </div>
      )}

      {executando && (
        <div
          className="muted pequeno formulario-retorno"
          role="status"
        >
          Salvando…
        </div>
      )}
    </form>
  );
}
