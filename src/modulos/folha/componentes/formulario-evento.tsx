import { Campo } from '@/componentes/globais/elementos';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { salvarEvento } from '@/modulos/folha/acoes';
import type { EventoFolha } from '@/modulos/folha/consultas';
const opcoes=[{valor:'nao',rotulo:'Não'},{valor:'sim',rotulo:'Sim'}];
export function FormularioEvento({evento}:{evento?:EventoFolha}){
 const cfg=evento?.configuracao_calculo||{};
 const padrao=(chave:string)=>{if(cfg[chave]===true)return 'sim';if(cfg[chave]===false)return 'nao';return chave.startsWith('integra_media_')&&/hora(s)? extra(s)?|dsr.*extra|rsr.*extra/i.test(evento?.nome||'')?'sim':'nao';};
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
  <Campo nome="integra_media_13" rotulo="Integra médias do 13º?" padrao={padrao('integra_media_13')} opcoes={opcoes}/>
  <Campo nome="integra_media_ferias" rotulo="Integra médias das férias?" padrao={padrao('integra_media_ferias')} opcoes={opcoes}/>
  <div className="largo aviso-configuracao">Horas extras históricas com descrição “Hora extra” são identificadas automaticamente. Para DSR sobre extras e outras verbas, revise as marcações.</div>
  <Campo nome="reduz_base" rotulo="Desconto reduz as bases?" padrao={padrao('reduz_base')} opcoes={opcoes}/>
  <div className="largo linha" style={{justifyContent:'flex-end'}}><button className="botao primario" type="submit">{evento?'Salvar alterações':'Salvar'}</button></div>
 </FormularioContinuo>;
}
