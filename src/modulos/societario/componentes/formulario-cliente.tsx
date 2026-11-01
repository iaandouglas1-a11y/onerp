import { Campo, Cartao } from '@/componentes/globais/elementos';
import { salvarCliente } from '@/modulos/societario/acoes';
import type { Cliente } from '@/tipos/modelos';
const pessoas=[{valor:'PJ',rotulo:'Pessoa jurídica'},{valor:'PF',rotulo:'Pessoa física'}];
const regimes=[{valor:'MEI',rotulo:'MEI'},{valor:'SIMPLES_NACIONAL',rotulo:'Simples Nacional'},{valor:'LUCRO_PRESUMIDO',rotulo:'Lucro Presumido'},{valor:'LUCRO_REAL',rotulo:'Lucro Real'},{valor:'ISENTO',rotulo:'Isento'},{valor:'OUTRO',rotulo:'Outro'}];
const situacoes=[{valor:'ONBOARDING',rotulo:'Em implantação'},{valor:'ATIVO',rotulo:'Ativo'},{valor:'RISCO',rotulo:'Em risco'},{valor:'INATIVO',rotulo:'Inativo'},{valor:'CANCELADO',rotulo:'Cancelado'}];
export function FormularioCliente({cliente}:{cliente?:Cliente|null}) {
  return <Cartao titulo={cliente?'Editar cliente':'Novo cliente'} subtitulo="Informações cadastrais, fiscais e operacionais"><form action={salvarCliente} className="grade-formulario">
    <input type="hidden" name="id" value={cliente?.id??''}/>
    <Campo rotulo="Tipo de pessoa" nome="tipo_pessoa" obrigatorio padrao={cliente?.tipo_pessoa??'PJ'} opcoes={pessoas}/>
    <Campo rotulo="CPF/CNPJ (apenas números)" nome="cpf_cnpj" obrigatorio padrao={cliente?.cpf_cnpj}/>
    <div className="largo"><Campo rotulo="Nome completo / Razão social" nome="razao_social" obrigatorio padrao={cliente?.razao_social}/></div>
    <Campo rotulo="Nome fantasia" nome="nome_fantasia" padrao={cliente?.nome_fantasia}/>
    <Campo rotulo="Regime tributário" nome="regime_tributario" padrao={cliente?.regime_tributario} opcoes={regimes}/>
    <Campo rotulo="Inscrição estadual" nome="inscricao_estadual" padrao={cliente?.inscricao_estadual}/>
    <Campo rotulo="Inscrição municipal" nome="inscricao_municipal" padrao={cliente?.inscricao_municipal}/>
    <Campo rotulo="Data de abertura" nome="data_abertura" tipo="date" padrao={cliente?.data_abertura}/>
    <Campo rotulo="CNAE principal" nome="cnae_principal" padrao={cliente?.cnae_principal}/>
    <div className="largo"><Campo rotulo="CNAEs secundários (separados por vírgula)" nome="cnaes_secundarios" padrao={cliente?.cnaes_secundarios?.join(', ')}/></div>
    <Campo rotulo="Situação" nome="situacao" padrao={cliente?.situacao??'ONBOARDING'} opcoes={situacoes}/>
    <div className="largo campo"><label htmlFor="observacoes">Observações internas</label><textarea id="observacoes" name="observacoes" defaultValue={cliente?.observacoes??''}/></div>
    <div className="largo linha entre"><span className="muted pequeno">O CPF/CNPJ deve ser único por escritório.</span><button className="botao primario" type="submit">{cliente?'Salvar alterações':'Cadastrar cliente'}</button></div>
  </form></Cartao>;
}
