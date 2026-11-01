'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';

export function BotaoConfirmar({mensagem,rotulo='Excluir',tipo='perigo'}:{mensagem:string;rotulo?:string;tipo?:'perigo'|'neutro'}) {
  const {pending:emEnvio}=useFormStatus();
  return <button className={`botao ${tipo==='perigo'?'perigo':''}`} type="submit" disabled={emEnvio} onClick={evento=>{if(!window.confirm(mensagem))evento.preventDefault();}}><Trash2 size={14}/>{emEnvio?'Processando…':rotulo}</button>;
}
