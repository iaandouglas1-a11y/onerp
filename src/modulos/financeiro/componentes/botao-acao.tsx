'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {DialogoConfirmacao} from '@/componentes/globais/dialogo-confirmacao';
import {mensagemErroPublica} from '@/componentes/globais/mensagens';
export function BotaoAcaoFinanceira({acao,id,campo='id',rotulo='Excluir',confirmacao,tipo='perigo'}:{acao:(dados:FormData)=>Promise<unknown>;id:string;campo?:string;rotulo?:string;confirmacao:string;tipo?:'perigo'|'neutro'}){
 const [pendente,definirPendente]=useState(false);const [aberto,definirAberto]=useState(false);const [erro,definirErro]=useState('');const roteador=useRouter();
 async function executar(){definirPendente(true);definirErro('');try{const dados=new FormData();dados.set(campo,id);await acao(dados);definirAberto(false);roteador.refresh();}
 catch(falha){definirErro(mensagemErroPublica(falha));}finally{definirPendente(false);}}
 return <><button type="button" disabled={pendente} onClick={()=>definirAberto(true)} className={`botao ${tipo==='perigo'?'perigo':''}`} style={{whiteSpace:'nowrap'}}>{pendente?'Processando…':rotulo}</button>
 <DialogoConfirmacao aberto={aberto} titulo={`${rotulo}?`} descricao={confirmacao} confirmar={rotulo} aoCancelar={()=>{if(!pendente)definirAberto(false);}} aoConfirmar={executar} processando={pendente} perigoso={tipo==='perigo'}/>
 {erro&&<div role="alert" className="mensagem erro">{erro}</div>}</>;
}
