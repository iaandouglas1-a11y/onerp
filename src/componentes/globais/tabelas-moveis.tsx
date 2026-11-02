'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Complemento exclusivamente visual: acrescenta rótulos aos campos das
 * tabelas para que cada linha seja apresentada como um cartão no celular.
 * Não modifica dados, eventos, formulários nem a ordenação das tabelas.
 */
export function TabelasMoveis() {
  const caminho = usePathname();

  useEffect(() => {
    const consultaMovel = window.matchMedia('(max-width: 800px)');
    let agendado = false;

    function rotularTabelas() {
      agendado = false;
      if (!consultaMovel.matches) return;
      document.querySelectorAll<HTMLTableElement>('table.tabela').forEach((tabela) => {
        const titulos = Array.from(tabela.querySelectorAll<HTMLTableCellElement>('thead tr:first-child th'))
          .map((celula) => celula.textContent?.trim() || 'Informação');
        if (!titulos.length) return;
        tabela.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((linha) => {
          Array.from(linha.children).forEach((celula, indice) => {
            if (!(celula instanceof HTMLTableCellElement)) return;
            const rotulo = titulos[indice] || 'Informação';
            if (celula.dataset.rotulo !== rotulo) celula.dataset.rotulo = rotulo;
          });
        });
      });
    }

    function agendarRotulagem() {
      if (agendado) return;
      agendado = true;
      window.requestAnimationFrame(rotularTabelas);
    }

    agendarRotulagem();
    const observador = new MutationObserver(agendarRotulagem);
    // Inclui também janelas flutuantes renderizadas fora do painel principal.
    observador.observe(document.body, { childList: true, subtree: true });
    consultaMovel.addEventListener('change', agendarRotulagem);
    return () => {
      observador.disconnect();
      consultaMovel.removeEventListener('change', agendarRotulagem);
    };
  }, [caminho]);

  return null;
}
