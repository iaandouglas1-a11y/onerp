import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { BotaoConfirmar } from '@/componentes/globais/botao-confirmar';
import { excluirMovimentoFiscal } from '@/modulos/fiscal/acoes';

export function AcoesMovimento({id,base,clienteId,permitirEdicao,permitirExclusao,origem}:{id:string;base:string;clienteId:string;permitirEdicao:boolean;permitirExclusao:boolean;origem:string}) {
  if(!permitirEdicao)return <span className="muted pequeno">Somente leitura</span>;
  if(origem!=='MANUAL')return <span className="muted pequeno" title="Movimento de origem externa — retificação pela rotina de importação">Importado</span>;
  const destino=`${base}${base.includes('?')?'&':'?'}editar=${id}`;
  return <div className="acoes-registro"><Link className="botao" href={destino}><Pencil size={13}/>Editar</Link>{permitirExclusao&&<form action={excluirMovimentoFiscal}><input name="id" type="hidden" value={id}/><input name="cliente_id" type="hidden" value={clienteId}/><BotaoConfirmar mensagem="Excluir este lançamento fiscal definitivamente? A alteração será refletida nos relatórios e no acumulado MEI. Esta operação não poderá ser desfeita."/></form>}</div>;
}
