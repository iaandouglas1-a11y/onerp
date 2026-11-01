import { Campo } from '@/componentes/globais/elementos';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { salvarLancamentoEvento } from '@/modulos/folha/acoes';
import type { Empregado,EventoFolha,LancamentoFolha } from '@/modulos/folha/consultas';
export function FormularioLancamento({empregados,eventos,competencia,lancamento}:{empregados:Empregado[];eventos:EventoFolha[];competencia:string;lancamento?:LancamentoFolha}){
 return <FormularioContinuo acao={salvarLancamentoEvento} modo={lancamento?'edicao':'cadastro'} rotaNovoAposEdicao={`/folha/lancamentos?competencia=${competencia}&novo=1`} className="grade-formulario" manterCampos={['empregado_id','evento_id','competencia']}>
  {lancamento&&<input type="hidden" name="id" value={lancamento.id}/>}
  <Campo nome="empregado_id" rotulo="Empregado" padrao={lancamento?.empregado_id||empregados[0]?.id} obrigatorio opcoes={empregados.map(e=>({valor:e.id,rotulo:e.nome_completo}))}/>
  <Campo nome="evento_id" rotulo="Evento" padrao={lancamento?.evento_id||eventos[0]?.id} obrigatorio opcoes={eventos.filter(e=>e.ativo).map(e=>({valor:e.id,rotulo:`${e.codigo} · ${e.nome}`}))}/>
  <Campo nome="competencia" rotulo="Competência" tipo="month" padrao={lancamento?.competencia?.slice(0,7)||competencia} obrigatorio/>
  <Campo nome="referencia" rotulo="Referência (ex.: 10h, 2 dias)" padrao={lancamento?.referencia}/>
  <Campo nome="valor" rotulo="Valor do evento (R$)" padrao={lancamento?.valor} obrigatorio/>
  <Campo nome="observacao" rotulo="Observação" padrao={lancamento?.observacao}/>
  <div className="largo linha" style={{justifyContent:'flex-end'}}><button type="submit" className="botao primario">{lancamento?'Salvar alterações':'Salvar e incluir outro'}</button></div>
 </FormularioContinuo>;
}
