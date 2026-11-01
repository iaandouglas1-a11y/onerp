import { PaginaModularFinanceira } from '@/modulos/financeiro/componentes/paginas';
export default async function Pagina({searchParams}:{searchParams:Promise<{modal?:string;id?:string;competencia?:string;cliente?:string;conta?:string;ano?:string}>}){
 return <PaginaModularFinanceira secao="fluxo-de-caixa" searchParams={searchParams}/>;
}
