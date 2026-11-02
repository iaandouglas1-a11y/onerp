'use client';

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { mensagemErroPublica, MENSAGENS } from './mensagens';

type RetornoSalvamento = { sucesso?: boolean; mensagem?: string } | undefined;
type AcaoSalvamento = (dados: FormData) => Promise<RetornoSalvamento>;

type Propriedades = {
  acao: AcaoSalvamento;
  children: ReactNode;
  className?: string;
  /** Rota de origem; após editar, retornar à listagem sem abrir um novo cadastro. */
  rotaNovoAposEdicao?: string;
  /** Chamado após limpar o DOM para zerar campos React controlados. */
  aoLimpar?: () => void;
  /** Ações pontuais (ex.: aprovação de parâmetro) não representam inclusão sequencial. */
  modo?: 'cadastro' | 'edicao' | 'acao';
  /** Campos de contexto que devem ser mantidos entre inclusões, além dos hidden e select. */
  manterCampos?: string[];
};

/**
 * Política de formulários On ERP:
 * - cadastrar => salvar sem navegar, exibir sucesso, limpar e permitir novo registro;
 * - editar => salvar e retornar à visualização de origem quando houver rota;
 * - erros => manter os dados preenchidos, sem fechar janela;
 * - ações pontuais => confirmar e manter dados, sem reset;
 * - dados ocultos e seletores de contexto são mantidos (cliente, modalidade etc.).
 */
export function FormularioContinuo({acao,children,className,rotaNovoAposEdicao,aoLimpar,modo='cadastro',manterCampos=[]}:Propriedades) {
  const referencia=useRef<HTMLFormElement>(null);
  const envioEmCurso=useRef(false);
  const [executando,iniciarTransicao]=useTransition();
  const [mensagem,definirMensagem]=useState('');
  const [erro,definirErro]=useState('');
  const roteador=useRouter();

  function limparCampos(formulario: HTMLFormElement) {
    formulario.reset();
    const mantidos = new Set(manterCampos);
    for (const campo of Array.from(formulario.elements)) {
      if (!(campo instanceof HTMLInputElement || campo instanceof HTMLTextAreaElement)) continue;
      if (!campo.name || campo instanceof HTMLInputElement && (
        ['hidden','submit','button','checkbox','radio'].includes(campo.type) || mantidos.has(campo.name)
      )) continue;
      if (campo instanceof HTMLTextAreaElement && mantidos.has(campo.name)) continue;
      campo.value='';
    }
    aoLimpar?.();
    const primeiro=formulario.querySelector<HTMLInputElement>('input:not([type=hidden]):not([disabled]),textarea:not([disabled])');
    primeiro?.focus();
  }

  function enviar(evento:FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if(executando||envioEmCurso.current)return;
    envioEmCurso.current=true;
    const formulario=evento.currentTarget;
    // O FormData é capturado ANTES da atualização do estado e da limpeza.
    const dados=new FormData(formulario);
    definirErro('');definirMensagem('');
    iniciarTransicao(async()=>{
      try {
        const retorno=await acao(dados);
        if(retorno&&retorno.sucesso===false)throw new Error(retorno.mensagem||'Não foi possível salvar.');
        if(modo==='edicao'&&rotaNovoAposEdicao){
          const destino = new URL(rotaNovoAposEdicao, 'https://on-erp.local');
          ['novo','editar','modal','id'].forEach(parametro=>destino.searchParams.delete(parametro));
          roteador.replace(destino.pathname + destino.search);
          roteador.refresh();
          return;
        }
        if(modo==='cadastro')limparCampos(formulario);
        formulario.dispatchEvent(new CustomEvent('onerp:salvo',{bubbles:true}));
        definirMensagem(retorno?.mensagem||(modo==='edicao'?MENSAGENS.edicao:MENSAGENS.cadastro));
        roteador.refresh();
      } catch(falha) {
        definirErro(mensagemErroPublica(falha,MENSAGENS.falhaSalvamento));
      } finally {
        envioEmCurso.current=false;
      }
    });
  }
  return <form ref={referencia} onSubmit={enviar} className={className} aria-busy={executando}>
    {children}
    {erro&&<div className="mensagem erro formulario-retorno" role="alert">{erro}</div>}
    {mensagem&&<div className="mensagem sucesso formulario-retorno" role="status">{mensagem}</div>}
    {executando&&<div className="muted pequeno formulario-retorno" role="status">Salvando…</div>}
  </form>;
}
