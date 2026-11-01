import Link from 'next/link';
import { CabecalhoPagina } from '@/componentes/globais/elementos';
import { FormularioCliente } from '@/modulos/societario/componentes/formulario-cliente';
export default function PaginaNovoCliente(){return <><CabecalhoPagina titulo="Cadastrar cliente" descricao="Inicie o cadastro central do escritório."/><div style={{maxWidth:900}}><p className="pequeno muted"><Link href="/societario/clientes">Clientes</Link> / Novo cadastro</p><FormularioCliente/></div></>}
