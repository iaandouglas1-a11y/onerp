'use client';
import { useEffect } from 'react';
export default function Erro({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('Falha de aplicação:',error.digest??'erro não identificado');},[error]);
  return <main style={{padding:35,maxWidth:690,margin:'auto'}}><h1>Não foi possível concluir a operação</h1><p className="muted">Não foi possível carregar esta página. Tente novamente. Se o problema continuar, informe o código da ocorrência ao suporte.</p>{error.digest&&<p className="muted pequeno">Código: {error.digest}</p>}<button className="botao primario" onClick={reset}>Tentar novamente</button></main>;
}
