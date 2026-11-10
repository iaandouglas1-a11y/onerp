'use client';
import { useState } from 'react';
import { Campo } from '@/componentes/globais/elementos';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { salvarLancamentoEvento } from '@/modulos/folha/acoes';
import { calcularEventoVariavel, referenciaDoEvento, type ReferenciaEvento } from '@/modulos/folha/calculo-eventos-variaveis';
import type { Empregado,EventoFolha,LancamentoFolha } from '@/modulos/folha/consultas';
export function FormularioLancamento({empregados,eventos,competencia,lancamento}:{empregados:Empregado[];eventos:EventoFolha[];competencia:string;lancamento?:LancamentoFolha}){
 const ativos=eventos.filter(e=>e.ativo);
 const [eventoId,definirEventoId]=useState(lancamento?.evento_id||ativos[0]?.id||'');
 const [empregadoId,definirEmpregadoId]=useState(lancamento?.empregado_id||empregados[0]?.id||'');
 const [quantidade,definirQuantidade]=useState(lancamento?.quantidade_referencia!=null?String(lancamento.quantidade_referencia):'');
 const evento=ativos.find(e=>e.id===eventoId);
 const empregado=empregados.find(e=>e.id===empregadoId);
 const referencia:ReferenciaEvento=referenciaDoEvento(evento?.configuracao_calculo||{});
 const unidade=referencia==='DIAS'?'dias':referencia==='HORAS'?'horas':'valor';
 let previa:string|null=null,erroPrevia:string|null=null;
 if(referencia!=='VALOR'&&quantidade&&empregado&&evento){
   try{const resultado=calcularEventoVariavel({codigo:evento.codigo,tipo_referencia:referencia,
     quantidade_referencia:Number(quantidade),salario:Number(empregado.salario),
     divisor_horas_mensais:empregado.divisor_horas_mensais?Number(empregado.divisor_horas_mensais):null,
     configuracao:{percentual_adicional:Number(evento.configuracao_calculo.percentual_adicional??0),
       divisor_dias:Number(evento.configuracao_calculo.divisor_dias??30)}});
     previa=resultado.valor.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
   }catch(erro){erroPrevia=erro instanceof Error?erro.message:'Não foi possível calcular a prévia.';}
 }

 return <FormularioContinuo acao={salvarLancamentoEvento} modo={lancamento?'edicao':'cadastro'} rotaNovoAposEdicao={`/folha/lancamentos?competencia=${competencia}&novo=1`} className="grade-formulario" manterCampos={['empregado_id','evento_id','competencia']} aoLimpar={()=>definirQuantidade('')}>
  {lancamento&&<input type="hidden" name="id" value={lancamento.id}/>}
  <div className="campo"><label htmlFor="empregado_id">Empregado *</label><select name="empregado_id" id="empregado_id" value={empregadoId} onChange={e=>definirEmpregadoId(e.target.value)} required>{empregados.map(e=><option key={e.id} value={e.id}>{e.nome_completo}</option>)}</select></div>
  <div className="campo"><label htmlFor="evento_id">Evento *</label><select name="evento_id" id="evento_id" value={eventoId} onChange={e=>{definirEventoId(e.target.value);definirQuantidade('');}} required>{ativos.map(e=><option key={e.id} value={e.id}>{e.codigo} · {e.nome}</option>)}</select></div>
  <Campo nome="competencia" rotulo="Competência" tipo="month" padrao={lancamento?.competencia?.slice(0,7)||competencia} obrigatorio/>
  <div className="campo"><label>Referência do cálculo</label><input value={referencia==='DIAS'?'Dias':referencia==='HORAS'?'Horas':'Valor informado'} readOnly aria-label="Tipo de referência"/></div>
  {referencia!=='VALOR' ? <div className="campo"><label htmlFor="quantidade_referencia">Quantidade de {unidade} *</label><input id="quantidade_referencia" name="quantidade_referencia" type="number" step="0.01" min="0.01" max={referencia==='DIAS'?'30':'744'} value={quantidade} onChange={e=>definirQuantidade(e.target.value)} required/></div> : <Campo key={`${eventoId}-valor`} nome="valor" rotulo="Valor do evento (R$)" padrao={lancamento?.evento_id===eventoId?lancamento.valor:null} obrigatorio/>}
  {referencia!=='VALOR'&&<div className="campo"><label>Valor calculado (prévia)</label><div className="muted pequeno" role="status">{erroPrevia||previa||'Informe a quantidade para visualizar o cálculo.'}</div></div>}
  {referencia==='HORAS'&&<div className="largo aviso-configuracao">O cálculo utiliza o divisor de horas mensais do empregado. Horas extras consideram o percentual parametrizado na rubrica; confira jornada, convenção coletiva e incidências.</div>}
  <Campo nome="observacao" rotulo="Observação" padrao={lancamento?.observacao}/>
  <div className="largo linha" style={{justifyContent:'flex-end'}}><button type="submit" className="botao primario">{lancamento?'Salvar alterações':'Salvar'}</button></div>
 </FormularioContinuo>;
}
