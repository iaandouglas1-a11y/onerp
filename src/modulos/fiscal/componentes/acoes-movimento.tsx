import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { BotaoConfirmar } from '@/componentes/globais/botao-confirmar';
import { excluirMovimentoFiscal } from '@/modulos/fiscal/acoes';

type Propriedades = {
  id: string;
  base: string;
  clienteId: string;
  origem?: string | null;
};

/**
 * As ações são oferecidas a qualquer usuário autenticado e vinculado ao escritório.
 * A validação de pertencimento ao escritório é refeita no servidor em cada operação.
 */
export function AcoesMovimento({ id, base, clienteId, origem }: Propriedades) {
  const rotaEdicao = `${base}${base.includes('?') ? '&' : '?'}editar=${encodeURIComponent(id)}`;
  const importado = origem === 'IMPORTACAO' || origem === 'DOCUMENTO_FISCAL';
  const avisoOrigem = importado
    ? ' Este lançamento veio de uma importação ou documento fiscal. A alteração ou exclusão não altera o documento original nem impede futuras reimportações.'
    : '';

  return <div className="acoes-registro" aria-label="Ações do lançamento">
    <Link className="botao" href={rotaEdicao} aria-label="Editar receita ou movimentação fiscal"><Pencil size={14}/> Editar</Link>
    <form action={excluirMovimentoFiscal}>
      <input name="id" type="hidden" value={id}/>
      <input name="cliente_id" type="hidden" value={clienteId}/>
      <BotaoConfirmar mensagem={`Excluir este lançamento fiscal definitivamente? Os totais de faturamento e relatórios serão atualizados. Esta ação não poderá ser desfeita.${avisoOrigem}`}/>
    </form>
  </div>;
}
