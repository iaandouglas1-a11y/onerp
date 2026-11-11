import { Navegacao } from '@/componentes/globais/navegacao';
import { Topo } from '@/componentes/globais/topo';
import { PainelOperacional } from '@/componentes/globais/painel-operacional';
import { TabelasMoveis } from '@/componentes/globais/tabelas-moveis';
import { obterContexto } from '@/lib/seguranca/contexto';
export default async function LayoutPainel({children}:{children:React.ReactNode}) {
  const contexto=await obterContexto();
  let nomeEscritorio='Configuração inicial';
  if(contexto.escritorioId){const {data:escritorio}=await contexto.banco.from('escritorios').select('nome').eq('id',contexto.escritorioId).single();nomeEscritorio=escritorio?.nome||'On Contabilidade';}
  return <div className="app"><Navegacao/><TabelasMoveis/><div id="conteudo-principal" className="principal"><Topo email={contexto.usuario.email??'Usuário'} nomeEscritorio={nomeEscritorio}/><main className="conteudo"><div className="on-workspace"><div className="on-workspace-main">{children}</div><PainelOperacional/></div></main></div></div>;
}
