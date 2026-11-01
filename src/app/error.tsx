'use client';
import { useEffect } from 'react';
export default function Erro({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('Falha de aplicação:',error.digest??'erro não identificado');},[error]);
  return <main style={{padding:35,maxWidth:690,margin:'auto'}}><h1>Não foi possível concluir a operação</h1><p className="muted">Verifique sua conexão e suas permissões. Se o problema continuar, registre o código da ocorrência.</p>{error.digest&&<p className="muted pequeno">Código: {error.digest}</p>}<button className="botao primario" onClick={reset}>Tentar novamente</button></main>;
}
