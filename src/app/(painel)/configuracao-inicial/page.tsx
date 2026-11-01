import { CampoDocumento } from '@/componentes/globais/campo-documento';
import { redirect } from 'next/navigation';
import { CabecalhoPagina, Cartao, Campo } from '@/componentes/globais/elementos';
import { obterContexto } from '@/lib/seguranca/contexto';
import { criarEscritorio } from '@/modulos/societario/acoes';
export default async function ConfiguracaoInicial(){const contexto=await obterContexto();if(contexto.escritorioId) redirect('/inicio');return <><CabecalhoPagina titulo="Configuração inicial" descricao="Cadastre a On Contabilidade para habilitar os módulos."/><div style={{maxWidth:640}}><Cartao titulo="Identificação do escritório"><form action={criarEscritorio} className="grade-formulario"><div className="largo"><Campo rotulo="Nome do escritório" nome="nome" obrigatorio padrao="On Contabilidade"/></div><Campo rotulo="Razão social (opcional)" nome="razao_social"/><CampoDocumento rotulo="CNPJ do escritório" nome="cpf_cnpj" tipoPadrao="PJ"/><div className="largo"><button className="botao primario" type="submit">Criar escritório</button></div></form></Cartao></div></>}
