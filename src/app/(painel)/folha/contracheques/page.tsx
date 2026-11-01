import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, Indicador, ListaVazia, Etiqueta } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { listarEmpregados,listarContracheques } from '@/modulos/folha/consultas';
import { listarClientes } from '@/modulos/societario/consultas';
import { mesValido,formatarCompetencia,moeda } from '@/lib/utilitarios/formatacao';
import { aprovarRegrasFolha,confirmarContracheque,gerarContracheque } from '@/modulos/folha/acoes';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import type { MemoriaContracheque } from '@/modulos/folha/calculos';
export default async function PaginaContracheques({searchParams}:{searchParams:Promise<{competencia?:string;novo?:string;parametros?:string}>}){
 const filtros=await searchParams;const competencia=mesValido(filtros.competencia);
 const [empregados,clientes,contracheques,{banco,escritorioId}]=await Promise.all([listarEmpregados(),listarClientes(),listarContracheques(competencia),exigirEscritorio()]);
 const {data:regras,error:erroRegras}=await banco.from('versoes_regras_folha').select('id,tipo_regra,inicio_vigencia,fim_vigencia,parametros,fundamento_legal,aprovado_em').eq('escritorio_id',escritorioId).eq('inicio_vigencia','2026-01-01');
 if(erroRegras)throw new Error('Não foi possível consultar regras da folha.');
 const aprovadas=['INSS','IRRF','FGTS'].every(tipo=>regras?.some(regra=>regra.tipo_regra===tipo&&regra.aprovado_em));
 const nomeEmpregado=new Map(empregados.map(e=>[e.id,e.nome_completo]));const nomeCliente=new Map(clientes.map(c=>[c.id,c.razao_social]));
 const rota=`/folha/contracheques?competencia=${competencia}`;
 return <><CabecalhoPagina titulo="Contracheques" descricao="Folha mensal básica e demonstrativo PDF em duas vias, conforme o modelo fornecido." acao="Gerar contracheque" rotaAcao={`${rota}&novo=1`}/>
 <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Contracheques do mês" valor={contracheques.length}/><Indicador legenda="Em conferência" valor={contracheques.filter(c=>c.situacao==='EM_CONFERENCIA').length}/><Indicador legenda="Conferidos" valor={contracheques.filter(c=>c.situacao==='CONFERIDO').length}/><Indicador legenda="Empregados ativos" valor={empregados.filter(e=>e.situacao==='ATIVO').length}/></div>
 <form className="filtros" action="/folha/contracheques"><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={competencia} obrigatorio/><button type="submit" className="botao">Consultar</button><Link className="botao" href={`${rota}&parametros=1`}>Parâmetros 2026</Link><Link className="botao" href="/folha/lancamentos">Lançar eventos</Link></form>
 {!aprovadas&&<div className="mensagem">Parâmetros de 2026 ainda não aprovados. Confira os fundamentos em Parâmetros 2026 antes de gerar contracheques.</div>}
 <div className="aviso-configuracao">Cálculo disponível apenas para mês integral de empregado ativo, com salário-base e eventos de valores informados. Férias, 13º, rescisão, admissões parciais e afastamentos ainda não estão habilitados. O PDF replica exclusivamente o formato de duas vias anexado.</div>
 <Cartao titulo={`Demonstrativos · ${formatarCompetencia(competencia)}`}>
 {contracheques.length===0?<ListaVazia texto="Nenhum contracheque gerado para esta competência."/>:
 <div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Empregado</th><th>Empresa</th><th>Líquido</th><th>Conferência</th><th>Ações</th></tr></thead><tbody>{contracheques.map(c=>{const memoria=c.memoria_calculo as unknown as MemoriaContracheque;return <tr key={c.id}><td>{nomeEmpregado.get(c.empregado_id)||memoria.funcionario?.nome||'—'}</td><td>{nomeCliente.get(c.cliente_id)||memoria.empresa?.nome||'—'}</td><td>{moeda(memoria.liquido)}</td><td><Etiqueta valor={c.situacao}/></td><td><div className="acoes-registro"><a href={`/folha/contracheques/${c.id}/pdf`} className="botao" target="_blank" rel="noopener noreferrer">Abrir PDF</a>{c.situacao==='EM_CONFERENCIA'&&<form action={confirmarContracheque}><input type="hidden" name="id" value={c.id}/><button type="submit" className="botao">Marcar conferido</button></form>}</div></td></tr>;})}</tbody></table></div>}
 </Cartao>
 {filtros.novo==='1'&&<JanelaModal titulo="Gerar contracheque" descricao="Cálculo de folha mensal integral; confira após gerar." fecharEm={rota} largura="ampla"><FormularioContinuo acao={gerarContracheque} className="grade-formulario" manterCampos={['empregado_id','competencia']}>
 <Campo nome="empregado_id" rotulo="Funcionário / empresa" obrigatorio padrao={empregados[0]?.id} opcoes={empregados.filter(e=>e.situacao==='ATIVO').map(e=>({valor:e.id,rotulo:`${e.nome_completo} — ${nomeCliente.get(e.cliente_id)||'Empresa'}`}))}/>
 <Campo nome="competencia" rotulo="Competência" tipo="month" obrigatorio padrao={competencia}/>
 <div className="largo linha" style={{justifyContent:'flex-end'}}><button className="botao primario" type="submit">Gerar e incluir outro</button></div>
 </FormularioContinuo></JanelaModal>}
 {filtros.parametros==='1'&&<JanelaModal titulo="Parâmetros oficiais 2026" descricao="Verifique as tabelas antes de aprovar seu uso." fecharEm={rota} largura="ampla">
 <div style={{display:'grid',gap:12}}>{['INSS','IRRF','FGTS'].map(tipo=>{const regra=regras?.find(r=>r.tipo_regra===tipo);return <div className="cartao" key={tipo}><strong>{tipo}</strong><p className="muted pequeno">{regra?.fundamento_legal||'Parâmetro não cadastrado. Execute a migração 004.'}</p><Etiqueta valor={regra?.aprovado_em?'CONFERIDO':'PENDENTE'}/>
 {regra&&<div className="pequeno" style={{marginTop:10}}>
  {tipo==='FGTS'?<p>Alíquota: {(Number((regra.parametros as Record<string,unknown>).aliquota)*100).toLocaleString('pt-BR')}%</p>
  :<><div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Faixa até</th><th>Alíquota</th>{tipo==='IRRF'&&<th>Parcela a deduzir</th>}</tr></thead><tbody>
  {((regra.parametros as {faixas?:{ate:number;aliquota:number;deducao?:number}[]}).faixas||[]).map((faixa,i)=><tr key={i}><td>{faixa.ate>999999?'Acima da última faixa':moeda(faixa.ate)}</td><td>{(faixa.aliquota*100).toLocaleString('pt-BR')}%</td>{tipo==='IRRF'&&<td>{moeda(faixa.deducao||0)}</td>}</tr>)}
  </tbody></table></div>
  {tipo==='IRRF'&&<p>Dedução simplificada: {moeda(Number((regra.parametros as Record<string,unknown>).desconto_simplificado))}; dependente: {moeda(Number((regra.parametros as Record<string,unknown>).deducao_dependente))}. Redução mensal conforme lei.</p>}</>}
 </div>}
 </div>;})}</div>
 <div className="aviso-configuracao">Conferir valores, incidências e situações específicas. A aprovação habilita o cálculo restrito da folha mensal de 2026; não representa homologação eSocial.</div>
 <FormularioContinuo acao={aprovarRegrasFolha} modo="acao"><input name="ano" type="hidden" value="2026"/><button className="botao primario" type="submit">Conferi as tabelas — Aprovar para uso</button></FormularioContinuo>
 </JanelaModal>}
 </>;
}
