import { CabecalhoPagina } from '@/componentes/globais/elementos';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { listarClientes } from '@/modulos/societario/consultas';
import { FormularioMovimento } from '@/modulos/fiscal/componentes/formulario-movimento';
export default async function NovoLancamento({searchParams}:{searchParams:Promise<{cliente?:string}>}){const contexto=await exigirEscritorio();const clientes=await listarClientes();const {cliente}=await searchParams;const {data:categorias}=await contexto.banco.from('categorias_fiscais').select('id,nome,tipo_movimento').eq('escritorio_id',contexto.escritorioId).eq('ativo',true).order('nome');return <><CabecalhoPagina titulo="Novo lançamento" descricao="Movimentação fiscal manual por cliente e competência."/><div style={{maxWidth:960}}><FormularioMovimento clientes={clientes} categorias={categorias??[]} clienteSelecionado={cliente}/></div></>}
