'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {Trash2, XCircle, RotateCcw} from 'lucide-react';
export function BotaoAcaoFinanceira({acao,id,campo='id',rotulo='Excluir',confirmacao,tipo='perigo'}:{acao:(dados:FormData)=>Promise<unknown>;id:string;campo?:string;rotulo?:string;confirmacao:string;tipo?:'perigo'|'neutro'}){
 const [pendente,definirPendente]=useState(false);const roteador=useRouter();
 async function executar(){if(!window.confirm(confirmacao))return;definirPendente(true);
 try{const dados=new FormData();dados.set(campo,id);await acao(dados);roteador.refresh();}
 catch(falha){window.alert(falha instanceof Error?falha.message:'Não foi possível concluir a operação.');}
 finally{definirPendente(false);}}
 return <button type="button" disabled={pendente} onClick={executar} className={`botao ${tipo==='perigo'?'perigo':''}`} style={{whiteSpace:'nowrap'}}>{pendente?'Aguarde…':rotulo}</button>;
}
