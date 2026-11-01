'use client';
import { useState } from 'react';
import { mascararDocumento } from '@/lib/utilitarios/formatacao';
import { Campo } from '@/componentes/globais/elementos';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { salvarCliente } from '@/modulos/societario/acoes';
import type { Cliente } from '@/tipos/modelos';
import type { ResumoAcessoGovBr } from '@/modulos/societario/acesso-govbr';
const pessoas=[{valor:'PJ',rotulo:'Pessoa jurídica'},{valor:'PF',rotulo:'Pessoa física'}];
const regimes=[{valor:'MEI',rotulo:'MEI'},{valor:'SIMPLES_NACIONAL',rotulo:'Simples Nacional'},{valor:'LUCRO_PRESUMIDO',rotulo:'Lucro Presumido'},{valor:'LUCRO_REAL',rotulo:'Lucro Real'},{valor:'ISENTO',rotulo:'Isento'},{valor:'OUTRO',rotulo:'Outro'}];
const situacoes=[{valor:'ONBOARDING',rotulo:'Em implantação'},{valor:'ATIVO',rotulo:'Ativo'},{valor:'RISCO',rotulo:'Em risco'},{valor:'INATIVO',rotulo:'Inativo'},{valor:'CANCELADO',rotulo:'Cancelado'}];
export function FormularioCliente({cliente, acessoGov, cofreHabilitado=false}:{cliente?:Cliente|null;acessoGov?:ResumoAcessoGovBr|null;cofreHabilitado?:boolean}) {
  const [tipoPessoa, definirTipoPessoa] = useState<'PF' | 'PJ'>(cliente?.tipo_pessoa ?? 'PJ');
  const [documento, definirDocumento] = useState(() => mascararDocumento(cliente?.cpf_cnpj ?? '', cliente?.tipo_pessoa ?? 'PJ'));
  const [cpfGov, definirCpfGov] = useState(() => mascararDocumento(acessoGov?.cpf ?? '', 'PF'));
  return <FormularioContinuo acao={salvarCliente} className="grade-formulario" modo={cliente?'edicao':'cadastro'} rotaNovoAposEdicao="/societario/clientes?novo=1" aoLimpar={()=>{definirTipoPessoa('PJ');definirDocumento('');definirCpfGov('');}}>
    <input type="hidden" name="id" value={cliente?.id??''}/>
    <div className="campo"><label htmlFor="tipo_pessoa">Tipo de pessoa *</label><select name="tipo_pessoa" id="tipo_pessoa" value={tipoPessoa} onChange={evento => { definirTipoPessoa(evento.target.value as 'PF' | 'PJ'); definirDocumento(''); }}>{pessoas.map(pessoa => <option key={pessoa.valor} value={pessoa.valor}>{pessoa.rotulo}</option>)}</select></div>
    <div className="campo"><label htmlFor="cpf_cnpj">{tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF'} *</label><input id="cpf_cnpj" name="cpf_cnpj" type="text" inputMode="numeric" autoComplete="off" required maxLength={tipoPessoa === 'PJ' ? 18 : 14} placeholder={tipoPessoa === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} value={documento} onChange={evento => definirDocumento(mascararDocumento(evento.target.value, tipoPessoa))}/></div>
    <div className="largo"><Campo rotulo="Nome completo / Razão social" nome="razao_social" obrigatorio padrao={cliente?.razao_social}/></div>
    <Campo rotulo="Nome fantasia" nome="nome_fantasia" padrao={cliente?.nome_fantasia}/>
    <Campo rotulo="Regime tributário" nome="regime_tributario" padrao={cliente?.regime_tributario} opcoes={regimes}/>
    <Campo rotulo="Inscrição estadual" nome="inscricao_estadual" padrao={cliente?.inscricao_estadual}/>
    <Campo rotulo="Inscrição municipal" nome="inscricao_municipal" padrao={cliente?.inscricao_municipal}/>
    <Campo rotulo="Data de abertura" nome="data_abertura" tipo="date" padrao={cliente?.data_abertura}/>
    <Campo rotulo="CNAE principal" nome="cnae_principal" padrao={cliente?.cnae_principal}/>
    <div className="largo"><Campo rotulo="CNAEs secundários (separados por vírgula)" nome="cnaes_secundarios" padrao={cliente?.cnaes_secundarios?.join(', ')}/></div>
    <Campo rotulo="Situação" nome="situacao" padrao={cliente?.situacao??'ONBOARDING'} opcoes={situacoes}/>
    <div className="largo" style={{marginTop:10,borderTop:'1px solid #E0E5EA',paddingTop:16}}>
      <h3 style={{fontSize:15,fontWeight:500,margin:'0 0 5px'}}>Acesso gov.br</h3>
      <p className="muted pequeno" style={{margin:0}}>Informe o CPF do titular da conta gov.br (pode ser diferente do CPF/CNPJ do cliente). A senha é armazenada apenas no cofre criptografado.</p>
    </div>
    <div className="campo">
      <label htmlFor="cpf_govbr">CPF de acesso gov.br</label>
      <input id="cpf_govbr" name="cpf_govbr" type="text" inputMode="numeric" maxLength={14}
        placeholder="000.000.000-00" autoComplete="off" disabled={!cofreHabilitado}
        value={cpfGov} onChange={evento=>definirCpfGov(mascararDocumento(evento.target.value,'PF'))}/>
    </div>
    <div className="campo">
      <label htmlFor="senha_govbr">Senha gov.br{acessoGov?.possuiSenha?' (deixe vazia para manter)':''}</label>
      <input id="senha_govbr" name="senha_govbr" type="password" maxLength={1024}
        placeholder={acessoGov?.possuiSenha?'Senha já cadastrada — não exibida':'Informe a senha, caso autorizado'}
        autoComplete="new-password" disabled={!cofreHabilitado}/>
    </div>
    <p className="muted pequeno largo" style={{margin:'0 0 6px'}}>
      {cofreHabilitado
        ? 'CPF e senha são opcionais no cadastro. Para adicionar ou trocar o CPF, informe a senha correspondente. Nunca insira códigos de verificação em dois fatores.'
        : 'Cofre indisponível: configure SUPABASE_SERVICE_ROLE_KEY e COFRE_CHAVE_CRIPTOGRAFIA na Vercel para habilitar o acesso gov.br.'}
    </p>
    <div className="largo campo"><label htmlFor="observacoes">Observações internas</label><textarea id="observacoes" name="observacoes" defaultValue={cliente?.observacoes??''}/></div>
    <div className="largo linha entre"><span className="muted pequeno">O CPF/CNPJ deve ser único por escritório.</span><button className="botao primario" type="submit">{cliente?'Salvar alterações':'Cadastrar cliente'}</button></div>
  </FormularioContinuo>;
}
