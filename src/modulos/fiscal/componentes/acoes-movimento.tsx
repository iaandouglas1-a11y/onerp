import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { BotaoConfirmar } from '@/componentes/globais/botao-confirmar';
import { excluirMovimentoFiscal } from '@/modulos/fiscal/acoes';

type Propriedades = {
  id: string;
  base: string;
  clienteId: string;
  permitirEdicao: boolean;
  permitirExclusao: boolean;
  origem: string | null | undefined;
};

/**
 * Exibe SEMPRE as duas ações. Lançamentos de origem externa e perfis sem permissão
 * continuam visíveis, mas com ações desabilitadas e motivo explícito.
 */
export function AcoesMovimento({ id, base, clienteId, permitirEdicao, permitirExclusao, origem }: Propriedades) {
  const manual = origem === 'MANUAL';
  const motivo = manual
    ? 'Seu perfil não tem permissão para esta operação.'
    : 'Lançamento importado: altere ou cancele pela rotina de origem.';
  const rotaEdicao = `${base}${base.includes('?') ? '&' : '?'}editar=${encodeURIComponent(id)}`;

  return <div className="acoes-registro">
    {manual && permitirEdicao
      ? <Link className="botao" href={rotaEdicao} aria-label="Editar lançamento fiscal"><Pencil size={13}/> Editar</Link>
      : <button type="button" className="botao" disabled title={motivo}><Pencil size={13}/> Editar</button>}
    {manual && permitirExclusao
      ? <form action={excluirMovimentoFiscal}>
          <input name="id" type="hidden" value={id}/>
          <input name="cliente_id" type="hidden" value={clienteId}/>
          <BotaoConfirmar mensagem="Excluir este lançamento fiscal definitivamente? O faturamento e os relatórios serão atualizados. Esta ação não poderá ser desfeita."/>
        </form>
      : <button type="button" className="botao perigo" disabled title={motivo}><Trash2 size={13}/> Excluir</button>}
  </div>;
}
