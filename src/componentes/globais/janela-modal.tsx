'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {DialogoConfirmacao} from './dialogo-confirmacao';
export function JanelaModal({titulo,descricao,fecharEm,children,largura='normal'}:{titulo:string;descricao?:string;fecharEm:string;children:ReactNode;largura?:'normal'|'ampla'}) {
 const roteador=useRouter();const referencia=useRef<HTMLDivElement>(null);const alterado=useRef(false);
 const [pedirDescarte,definirPedirDescarte]=useState(false);
 useEffect(()=>{const elemento=referencia.current;if(!elemento)return;const salvo=()=>{alterado.current=false;};elemento.addEventListener('onerp:salvo',salvo);return()=>elemento.removeEventListener('onerp:salvo',salvo);},[]);
 const fechar=useCallback(()=>{if(alterado.current)definirPedirDescarte(true);else roteador.replace(fecharEm);},[roteador,fecharEm]);
 useEffect(()=>{const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;referencia.current?.focus();
 const tecla=(evento:KeyboardEvent)=>{if(evento.key==='Escape'){evento.preventDefault();fechar();}};document.addEventListener('keydown',tecla);
 const transbordamento=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',tecla);document.body.style.overflow=transbordamento;anterior?.focus();};},[fechar]);
 return <div className="modal-fundo" role="presentation" onMouseDown={evento=>{if(evento.target===evento.currentTarget)fechar();}}>
  <div className={`modal-janela ${largura==='ampla'?'modal-ampla':''}`} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={referencia} onInput={()=>{alterado.current=true;}} onChange={()=>{alterado.current=true;}}>
   <div className="modal-cabecalho"><div><h2>{titulo}</h2>{descricao&&<p className="muted pequeno">{descricao}</p>}</div><button type="button" aria-label="Fechar janela" className="modal-fechar" onClick={fechar}><X size={18}/></button></div>
   <div className="modal-corpo">{children}</div>
  </div>
  <DialogoConfirmacao aberto={pedirDescarte} titulo="Descartar alterações?" descricao="As informações ainda não salvas serão perdidas." confirmar="Descartar alterações" aoCancelar={()=>definirPedirDescarte(false)} aoConfirmar={()=>{alterado.current=false;definirPedirDescarte(false);roteador.replace(fecharEm);}}/>
 </div>;
}
