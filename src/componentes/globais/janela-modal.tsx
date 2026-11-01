'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

/** Janela contextual reutilizável: os formulários permanecem fora das listagens. */
export function JanelaModal({titulo,descricao,fecharEm,children,largura='normal'}:{titulo:string;descricao?:string;fecharEm:string;children:ReactNode;largura?:'normal'|'ampla'}) {
  const roteador=useRouter();
  const referencia=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const anterior=document.activeElement instanceof HTMLElement?document.activeElement:null;
    referencia.current?.focus();
    const tecla=(evento:KeyboardEvent)=>{if(evento.key==='Escape'){evento.preventDefault();roteador.replace(fecharEm);}};
    document.addEventListener('keydown',tecla);
    const transbordamento=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{document.removeEventListener('keydown',tecla);document.body.style.overflow=transbordamento;anterior?.focus();};
  },[fecharEm,roteador]);
  return <div className="modal-fundo" role="presentation" onMouseDown={evento=>{if(evento.target===evento.currentTarget)roteador.replace(fecharEm);}}>
    <div className={`modal-janela ${largura==='ampla'?'modal-ampla':''}`} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1} ref={referencia}>
      <div className="modal-cabecalho"><div><h2>{titulo}</h2>{descricao&&<p className="muted pequeno">{descricao}</p>}</div><button type="button" aria-label="Fechar janela" className="modal-fechar" onClick={()=>roteador.replace(fecharEm)}><X size={18}/></button></div>
      <div className="modal-corpo">{children}</div>
    </div>
  </div>;
}
