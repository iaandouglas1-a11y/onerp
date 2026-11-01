import { Bell, ShieldCheck } from 'lucide-react';
export function Topo({email,nomeEscritorio}:{email:string;nomeEscritorio:string}) {
  const letra=(email[0]||'O').toUpperCase();
  return <header className="topo"><div className="linha"><span className="nome">On ERP</span><span className="etiqueta verde visivel-desktop"><ShieldCheck size={12}/> Ambiente seguro</span></div><div className="topo-direita"><span className="muted pequeno visivel-desktop">{nomeEscritorio}</span><Bell size={17} strokeWidth={1.6} color="#748195"/><div className="usuario"><span className="avatar">{letra}</span><span>{email}</span></div></div></header>;
}
