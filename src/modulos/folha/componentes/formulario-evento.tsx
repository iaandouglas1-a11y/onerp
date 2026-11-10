import { Campo } from '@/componentes/globais/elementos';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { salvarEvento } from '@/modulos/folha/acoes';
import type { EventoFolha } from '@/modulos/folha/consultas';
const opcoes=[{valor:'nao',rotulo:'Não'},{valor:'sim',rotulo:'Sim'}];
export function FormularioEvento({evento}:{evento?:EventoFolha}){
 const cfg=evento?.configuracao_calculo||{};
 const padrao=(chave:string)=>cfg[chave]===true?'sim':'nao';
 return <FormularioContinuo acao={salvarEvento} modo={evento?'edicao':'cadastro'} rotaNovoAposEdicao="/folha/eventos?novo=1" className="grade-formulario">
  {evento&&<input type="hidden" name="id" value={evento.id}/>}
  <Campo nome="codigo" rotulo="Código do evento" tipo="number" min="1" step="1" obrigatorio padrao={evento?.codigo} placeholder="29"/>
  <Campo nome="nome" rotulo="Descrição" obrigatorio padrao={evento?.nome} placeholder="Hora extra 50%"/>
  <Campo nome="tipo_evento" rotulo="Tipo" padrao={evento?.tipo_evento||'PROVENTO'} obrigatorio opcoes={[
    {valor:'PROVENTO',rotulo:'Provento'},{valor:'DESCONTO',rotulo:'Desconto'},{valor:'INFORMATIVO',rotulo:'Informativo'}]}/>
  <Campo nome="ativo" rotulo="Situação" padrao={evento?.ativo===false?'nao':'sim'} opcoes={[{valor:'sim',rotulo:'Ativo'},{valor:'nao',rotulo:'Inativo'}]}/>
  <Campo nome="tipo_referencia" rotulo="Referência de cálculo" padrao={String(cfg.tipo_referencia||'VALOR')} opcoes={[{valor:'VALOR',rotulo:'Valor informado (R$)'},{valor:'DIAS',rotulo:'Quantidade de dias (salário/30)'},{valor:'HORAS',rotulo:'Quantidade de horas (salário/divisor)'}]}/>
  <Campo nome="percentual_adicional" rotulo="Adicional sobre a hora (%)" tipo="number" min="0" max="300" step="0.01" padrao={Number(cfg.percentual_adicional||0)}/>
  <div className="largo aviso-configuracao">A referência DIAS ou HORAS calcula pelo salário do empregado. Para DSR, noturno, insalubridade e outros casos com bases especiais, use Valor informado até parametrizar a regra aplicável. Revise as incidências antes de processar.</div>
  <Campo nome="incide_inss" rotulo="Integra base do INSS?" padrao={padrao('incide_inss')} opcoes={opcoes}/>
  <Campo nome="incide_irrf" rotulo="Integra base do IRRF?" padrao={padrao('incide_irrf')} opcoes={opcoes}/>
  <Campo nome="incide_fgts" rotulo="Integra base do FGTS?" padrao={padrao('incide_fgts')} opcoes={opcoes}/>
  <Campo nome="reduz_base" rotulo="Desconto reduz as bases?" padrao={padrao('reduz_base')} opcoes={opcoes}/>
  <div className="largo linha" style={{justifyContent:'flex-end'}}><button className="botao primario" type="submit">{evento?'Salvar alterações':'Salvar'}</button></div>
 </FormularioContinuo>;
}
