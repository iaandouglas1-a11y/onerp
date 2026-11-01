import { Campo } from '@/componentes/globais/elementos';
import { CampoDocumento } from '@/componentes/globais/campo-documento';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { salvarEmpregado } from '@/modulos/folha/acoes';
import type { Empregado } from '@/modulos/folha/consultas';

type ClienteResumido={id:string;razao_social:string};
export function FormularioEmpregado({clientes,empregado}:{clientes:ClienteResumido[];empregado?:Empregado}){
 return <FormularioContinuo acao={salvarEmpregado} modo={empregado?'edicao':'cadastro'} rotaNovoAposEdicao="/folha/empregados?novo=1" className="grade-formulario" manterCampos={['cliente_id']}>
  {empregado&&<input type="hidden" name="id" value={empregado.id}/>}
  <Campo rotulo="Empresa" nome="cliente_id" obrigatorio padrao={empregado?.cliente_id||clientes[0]?.id} opcoes={clientes.map(c=>({valor:c.id,rotulo:c.razao_social}))}/>
  <Campo rotulo="Código do funcionário" nome="codigo_funcionario" padrao={empregado?.codigo_funcionario} placeholder="0001"/>
  <div className="largo"><Campo rotulo="Nome completo" nome="nome_completo" obrigatorio padrao={empregado?.nome_completo}/></div>
  <CampoDocumento nome="cpf" rotulo="CPF" padrao={empregado?.cpf} obrigatorio tipoPadrao="PF"/>
  <Campo rotulo="Data de nascimento" nome="data_nascimento" tipo="date" padrao={empregado?.data_nascimento}/>
  <Campo rotulo="Cargo / função" nome="cargo" padrao={empregado?.cargo}/>
  <Campo rotulo="CBO" nome="cbo" padrao={empregado?.cbo} placeholder="0000-00"/>
  <Campo rotulo="Salário-base (R$)" nome="salario" padrao={empregado?.salario} obrigatorio placeholder="2138,80"/>
  <Campo rotulo="Divisor de horas mensais" nome="divisor_horas_mensais" tipo="number" min="1" max="400" step="0.01" padrao={empregado?.divisor_horas_mensais??null} obrigatorio placeholder="220"/>
  <Campo rotulo="Jornada" nome="jornada_trabalho" padrao={empregado?.jornada_trabalho} placeholder="44h semanais"/>
  <Campo rotulo="Admissão" nome="data_admissao" tipo="date" padrao={empregado?.data_admissao} obrigatorio/>
  <Campo rotulo="Desligamento" nome="data_desligamento" tipo="date" padrao={empregado?.data_desligamento}/>
  <Campo rotulo="Dependentes IRRF" nome="dependentes_irrf" tipo="number" padrao={empregado?.dependentes_irrf??0} min="0" max="99"/>
  <Campo rotulo="Situação" nome="situacao" padrao={empregado?.situacao||'ATIVO'} obrigatorio opcoes={[{valor:'ATIVO',rotulo:'Ativo'},{valor:'AFASTADO',rotulo:'Afastado'},{valor:'DESLIGADO',rotulo:'Desligado'}]}/>
  <div className="campo largo"><label htmlFor="observacoes">Observações</label><textarea id="observacoes" name="observacoes" defaultValue={empregado?.observacoes||''}/></div>
  <div className="largo linha" style={{justifyContent:'flex-end'}}><button className="botao primario" type="submit">{empregado?'Salvar alterações':'Salvar e incluir outro'}</button></div>
 </FormularioContinuo>;
}
