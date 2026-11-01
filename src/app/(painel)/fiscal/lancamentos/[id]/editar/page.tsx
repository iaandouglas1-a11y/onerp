import { notFound } from 'next/navigation';
import { CabecalhoPagina } from '@/componentes/globais/elementos';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { listarClientes } from '@/modulos/societario/consultas';
import { FormularioMovimento } from '@/modulos/fiscal/componentes/formulario-movimento';
import type { MovimentoFiscal } from '@/tipos/modelos';
export default async function EditarMovimento({params}:{params:Promise<{id:string}>}){const {id}=await params;const contexto=await exigirEscritorio();const [{data:movimento},{data:categorias},clientes]=await Promise.all([contexto.banco.from('movimentacoes_fiscais').select('*').eq('id',id).eq('escritorio_id',contexto.escritorioId).maybeSingle(),contexto.banco.from('categorias_fiscais').select('id,nome,tipo_movimento').eq('escritorio_id',contexto.escritorioId).eq('ativo',true),listarClientes()]);if(!movimento)notFound();return <><CabecalhoPagina titulo="Editar lançamento" descricao="Atualização auditável pelo banco e permissões do escritório."/><div style={{maxWidth:960}}><FormularioMovimento clientes={clientes} categorias={categorias??[]} movimento={movimento as MovimentoFiscal}/></div></>}
