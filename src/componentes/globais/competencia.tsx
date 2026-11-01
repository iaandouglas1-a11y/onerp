'use client';

import { useEffect, useRef, useState } from 'react';
import { formatarCompetencia, interpretarCompetencia } from '@/lib/utilitarios/formatacao';

/**
 * Exibe MM/AAAA e envia AAAA-MM, preservando o formato esperado pelo banco.
 * Usado em filtros GET e formulários POST sem necessidade de alterar as ações.
 */
export function EntradaCompetencia({
  nome='competencia',id,padrao,obrigatorio=false
}: {nome?:string;id?:string;padrao?:string|null;obrigatorio?:boolean}) {
  const inicial=formatarCompetencia(padrao);
  const [valor,definirValor]=useState(inicial);
  const referencia=useRef<HTMLInputElement>(null);

  useEffect(()=>{definirValor(inicial);},[inicial]);
  useEffect(()=>{
    const formulario=referencia.current?.form;
    if(!formulario)return;
    const aoLimpar=()=>definirValor(inicial);
    formulario.addEventListener('reset',aoLimpar);
    return ()=>formulario.removeEventListener('reset',aoLimpar);
  },[inicial]);

  function mascarar(texto:string){
    const numeros=texto.replace(/\D/g,'').slice(0,6);
    return numeros.length>2?`${numeros.slice(0,2)}/${numeros.slice(2)}`:numeros;
  }

  return <>
    <input
      ref={referencia}
      id={id??nome}
      type="text"
      className="entrada entrada-competencia"
      inputMode="numeric"
      autoComplete="off"
      placeholder="MM/AAAA"
      pattern="(0[1-9]|1[0-2])/[0-9]{4}"
      title="Informe a competência no formato MM/AAAA"
      maxLength={7}
      value={valor}
      onChange={evento=>definirValor(mascarar(evento.target.value))}
      required={obrigatorio}
    />
    <input type="hidden" name={nome} value={interpretarCompetencia(valor)??''}/>
  </>;
}
