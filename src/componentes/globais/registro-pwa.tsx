'use client';
import { useEffect } from 'react';
/** PWA sem cache de documentos, respostas autenticadas ou credenciais. */
export function RegistroPwa() {
  useEffect(()=>{
    if('serviceWorker' in navigator&&window.isSecureContext){
      navigator.serviceWorker.register('/servico-offline.js').catch(()=>{/* Falha de instalação não bloqueia o uso web. */});
    }
  },[]);
  return null;
}
