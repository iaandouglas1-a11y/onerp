import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioMovimento } from './formulario-movimento';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { listarClientes } from '@/modulos/societario/consultas';
import type { MovimentoFiscal } from '@/tipos/modelos';

/** Consulta o registro a editar no servidor e abre uma janela sobre a listagem. */
export async function ModalMovimento({novo,editar,clienteSelecionado,fecharEm,modo='todos'}:{novo?:string;editar?:string;clienteSelecionado?:string;fecharEm:string;modo?:'todos'|'mei'|'convencional'}){
  if(novo!=='1'&&!editar)return null;
  const contexto=await exigirEscritorio();
  const [clientes,resultadoCategorias,resultadoMovimento]=await Promise.all([
    listarClientes(),
    contexto.banco.from('categorias_fiscais').select('id,nome,tipo_movimento').eq('escritorio_id',contexto.escritorioId).eq('ativo',true).order('nome'),
    editar?contexto.banco.from('movimentacoes_fiscais').select('*').eq('escritorio_id',contexto.escritorioId).eq('id',editar).maybeSingle():Promise.resolve({data:null,error:null}),
  ]);
  if(resultadoCategorias.error)throw new Error('Falha ao carregar categorias fiscais.');
  if(resultadoMovimento.error)throw new Error('Falha ao carregar lançamento fiscal.');
  const movimento=resultadoMovimento.data as MovimentoFiscal|null;
  if(editar&&!movimento)return null;
  const clientesPermitidos=clientes.filter(item=>modo==='mei'?item.regime_tributario==='MEI':modo==='convencional'?item.regime_tributario!=='MEI':true);
  if(movimento&&!clientesPermitidos.some(item=>item.id===movimento.cliente_id))return null;
  if(movimento&&clienteSelecionado&&movimento.cliente_id!==clienteSelecionado)return null;
  if(movimento&&modo==='mei'&&movimento.tipo_movimento!=='RECEITA')return null;
  if(clientesPermitidos.length===0)return <JanelaModal titulo="Novo lançamento fiscal" fecharEm={fecharEm}><p className="muted pequeno">Cadastre primeiro um cliente compatível com esta modalidade de faturamento.</p></JanelaModal>;
  return <JanelaModal titulo={movimento?'Editar lançamento':'Novo lançamento fiscal'} descricao="Dados do movimento e competência" fecharEm={fecharEm} largura="ampla">
    <FormularioMovimento key={movimento?.id??'novo'} clientes={clientesPermitidos} categorias={resultadoCategorias.data??[]} movimento={movimento} clienteSelecionado={clienteSelecionado} modo={modo} rotaNovo={`${fecharEm}${fecharEm.includes('?')?'&':'?'}novo=1`}/>
  </JanelaModal>;
}
