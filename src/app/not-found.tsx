import Link from 'next/link';
export default function NaoEncontrada(){return <main style={{margin:40}}><h1>Página não encontrada</h1><p>Verifique o endereço e tente novamente.</p><Link href="/inicio" className="botao primario">Voltar ao início</Link></main>;}
