import { Navegacao } from '@/componentes/globais/navegacao';
import { Topo } from '@/componentes/globais/topo';
import { obterContexto } from '@/lib/seguranca/contexto';
export default async function LayoutPainel({children}:{children:React.ReactNode}) {
  const contexto=await obterContexto();
  let nomeEscritorio='Configuração inicial';
  if(contexto.escritorioId){const {data:escritorio}=await contexto.banco.from('escritorios').select('nome').eq('id',contexto.escritorioId).single();nomeEscritorio=escritorio?.nome||'On Contabilidade';}
  return <div className="app"><Navegacao/><div className="principal"><Topo email={contexto.usuario.email??'Usuário'} nomeEscritorio={nomeEscritorio}/><main className="conteudo">{children}</main></div></div>;
}
