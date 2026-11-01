'use client';
import {useState} from 'react';
import { Eye, FileDown } from 'lucide-react';
import { obterLinkDocumento,revelarCredencial } from '@/modulos/societario/acoes';
export function BotaoDocumento({id}:{id:string}){
  const [erro,setErro]=useState('');const [carregando,setCarregando]=useState(false);
  async function abrir(){setCarregando(true);setErro('');try{const endereco=await obterLinkDocumento(id);if(!endereco)throw new Error('Arquivo indisponível.');window.location.assign(endereco);}catch(falha){setErro(falha instanceof Error?falha.message:'Falha ao abrir arquivo.');}finally{setCarregando(false);}}
  return <span><button className="botao" disabled={carregando} onClick={abrir}><FileDown/>Abrir</button>{erro&&<span className="pequeno" style={{color:'#a73535'}}>{erro}</span>}</span>;
}
export function BotaoRevelar({id,clienteId}:{id:string;clienteId:string}){
  const [segredo,setSegredo]=useState<string|null>(null);const [erro,setErro]=useState('');const [carregando,setCarregando]=useState(false);
  async function revelar(){setCarregando(true);setErro('');try{const valor=await revelarCredencial(id,clienteId);setSegredo(valor);}catch(falha){setErro(falha instanceof Error?falha.message:'Acesso negado.');}finally{setCarregando(false);}}
  return <div className="linha"><button className="botao" disabled={carregando} onClick={revelar}><Eye/>Revelar</button>{segredo!==null&&<><code style={{fontSize:12,maxWidth:280,overflowWrap:'anywhere'}}>{segredo}</code><button className="botao" onClick={()=>setSegredo(null)}>Ocultar</button></>}{erro&&<span style={{color:'#a73535'}} className="pequeno">{erro}</span>}</div>;
}
