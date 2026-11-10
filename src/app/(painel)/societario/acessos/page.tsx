import Link from 'next/link';
import { CabecalhoPagina,Cartao } from '@/componentes/globais/elementos';
import { listarClientes } from '@/modulos/societario/consultas';
export default async function Acessos(){const clientes=await listarClientes();return <><CabecalhoPagina titulo="Cofre de acessos" descricao="Selecione um cliente para gerenciar seus portais e credenciais."/><Cartao titulo="Clientes">{clientes.map(item=><div className="item-lista" key={item.id}><span>{item.razao_social}</span><Link className="botao" href={`/societario/clientes/${item.id}?aba=acessos`}>Abrir cofre</Link></div>)}</Cartao></>}
