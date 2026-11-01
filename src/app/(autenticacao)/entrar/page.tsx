'use client';
import { useState, type FormEvent } from 'react';
import { criarClienteNavegador } from '@/lib/supabase/navegador';
export default function Entrar() {
  const [erro,setErro]=useState('');const [carregando,setCarregando]=useState(false);
  async function autenticar(evento:FormEvent<HTMLFormElement>) {
    evento.preventDefault();setCarregando(true);setErro('');
    const dados=new FormData(evento.currentTarget);
    const {error:falha}=await criarClienteNavegador().auth.signInWithPassword({email:String(dados.get('email')),password:String(dados.get('senha'))});
    if(falha){setErro('Não foi possível entrar. Confira seu e-mail e senha.');setCarregando(false);return;}
    window.location.assign('/inicio');
  }
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:20,background:'#0A111C'}}><div className="cartao" style={{width:'100%',maxWidth:390,padding:34}}><div className="linha" style={{marginBottom:26}}><img src="/icons/on-erp.svg" alt="On Contabilidade" style={{width:58,height:58,borderRadius:10}}/><div><h1 style={{margin:0}}>On ERP</h1><p className="muted pequeno" style={{margin:0}}>Acesso interno</p></div></div><h2>Entrar na plataforma</h2><p className="muted pequeno">Utilize o usuário criado no Supabase Auth.</p><form onSubmit={autenticar} className="grade" style={{gap:16}}><div className="campo"><label>E-mail</label><input name="email" type="email" autoComplete="email" required/></div><div className="campo"><label>Senha</label><input name="senha" type="password" autoComplete="current-password" required minLength={6}/></div>{erro&&<div className="mensagem erro">{erro}</div>}<button className="botao primario" disabled={carregando}>{carregando?'Autenticando…':'Entrar'}</button></form></div></main>;
}
