import { notFound } from 'next/navigation';
import { CabecalhoPagina } from '@/componentes/globais/elementos';
import { FormularioCliente } from '@/modulos/societario/componentes/formulario-cliente';
import { buscarCliente } from '@/modulos/societario/consultas';
export default async function PaginaEditar({params}:{params:Promise<{id:string}>}){const {id}=await params;const cliente=await buscarCliente(id);if(!cliente)notFound();return <><CabecalhoPagina titulo="Editar cliente" descricao={cliente.razao_social}/><div style={{maxWidth:950}}><FormularioCliente cliente={cliente}/></div></>}
