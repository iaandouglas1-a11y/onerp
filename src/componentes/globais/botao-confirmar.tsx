'use client';
import {useRef,useState} from 'react';
import {useFormStatus} from 'react-dom';
import {Trash2} from 'lucide-react';
import {DialogoConfirmacao} from './dialogo-confirmacao';
export function BotaoConfirmar({mensagem,rotulo='Excluir',tipo='perigo'}:{mensagem:string;rotulo?:string;tipo?:'perigo'|'neutro'}){
 const {pending:emEnvio}=useFormStatus();const [aberto,definirAberto]=useState(false);
 const botao=useRef<HTMLButtonElement>(null);const confirmado=useRef(false);
 const confirmar=()=>{definirAberto(false);const formulario=botao.current?.form;if(!formulario||!botao.current)return;confirmado.current=true;formulario.requestSubmit(botao.current);confirmado.current=false;};
 return <><button ref={botao} className={`botao ${tipo==='perigo'?'perigo':''}`} type="submit" disabled={emEnvio} onClick={evento=>{if(confirmado.current)return;evento.preventDefault();definirAberto(true);}}><Trash2 size={14}/>{emEnvio?'Processando…':rotulo}</button>
 <DialogoConfirmacao aberto={aberto} titulo={`${rotulo}?`} descricao={mensagem} confirmar={rotulo} aoCancelar={()=>definirAberto(false)} aoConfirmar={confirmar} perigoso={tipo==='perigo'}/></>;
}
