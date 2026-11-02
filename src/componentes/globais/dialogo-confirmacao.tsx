'use client';
import {useEffect, useRef} from 'react';
import {AlertTriangle, X} from 'lucide-react';

type Props={aberto:boolean;titulo:string;descricao:string;confirmar:string;aoCancelar:()=>void;aoConfirmar:()=>void;processando?:boolean;perigoso?:boolean};
export function DialogoConfirmacao({aberto,titulo,descricao,confirmar,aoCancelar,aoConfirmar,processando=false,perigoso=true}:Props){
 const referencia=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!aberto)return;referencia.current?.focus();const tecla=(evento:KeyboardEvent)=>{if(evento.key==='Escape'&&!processando){evento.stopPropagation();evento.preventDefault();aoCancelar();}};document.addEventListener('keydown',tecla,true);return()=>document.removeEventListener('keydown',tecla,true);},[aberto,processando,aoCancelar]);
 if(!aberto)return null;
 return <div className="confirmacao-fundo" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!processando)aoCancelar();}}>
  <section role="alertdialog" aria-modal="true" aria-labelledby="confirmacao-titulo" aria-describedby="confirmacao-descricao" className="confirmacao-janela">
   <div className="confirmacao-topo"><span className="confirmacao-icone"><AlertTriangle size={20}/></span><button type="button" className="modal-fechar" onClick={aoCancelar} disabled={processando} aria-label="Fechar confirmação"><X size={17}/></button></div>
   <h2 id="confirmacao-titulo">{titulo}</h2><p id="confirmacao-descricao">{descricao}</p>
   <div className="confirmacao-acoes"><button ref={referencia} type="button" className="botao" onClick={aoCancelar} disabled={processando}>Cancelar</button><button type="button" className={`botao ${perigoso?'perigo':'primario'}`} disabled={processando} onClick={aoConfirmar}>{processando?'Processando…':confirmar}</button></div>
  </section>
 </div>;
}
