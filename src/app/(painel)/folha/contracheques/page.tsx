import Link from 'next/link';
import { CabecalhoPagina, Cartao, Campo, Indicador, ListaVazia, Etiqueta } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { BotaoConfirmar } from '@/componentes/globais/botao-confirmar';
import { listarEmpregados, listarContracheques } from '@/modulos/folha/consultas';
import { listarClientes } from '@/modulos/societario/consultas';
import { mesValido, formatarCompetencia, moeda } from '@/lib/utilitarios/formatacao';
import { aprovarRegrasFolha, confirmarContracheque, processarFolhaEmpresa, reabrirFolhaEmpresa } from '@/modulos/folha/acoes';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import type { MemoriaContracheque } from '@/modulos/folha/calculos';
export default async function PaginaContracheques({searchParams}:{searchParams:Promise<{competencia?:string;cliente?:string;novo?:string;parametros?:string}>}){
 const filtros=await searchParams;const competencia=mesValido(filtros.competencia);
 const [empregados,clientes,contracheques,{banco,escritorioId}]=await Promise.all([listarEmpregados(),listarClientes(),listarContracheques(competencia),exigirEscritorio()]);
 const {data:regras,error:erroRegras}=await banco.from('versoes_regras_folha').select('id,tipo_regra,inicio_vigencia,fim_vigencia,parametros,fundamento_legal,aprovado_em').eq('escritorio_id',escritorioId).eq('inicio_vigencia','2026-01-01');
 if(erroRegras)throw new Error('Não foi possível consultar regras da folha.');
 const aprovadas=['INSS','IRRF','FGTS'].every(tipo=>regras?.some(regra=>regra.tipo_regra===tipo&&regra.aprovado_em));
 const clienteId=filtros.cliente&&clientes.some(c=>c.id===filtros.cliente)?filtros.cliente:clientes[0]?.id||'';
 const empresa=clientes.find(c=>c.id===clienteId);
 const empregadosEmpresa=empregados.filter(e=>e.cliente_id===clienteId);
 const contrachequesEmpresa=contracheques.filter(c=>c.cliente_id===clienteId);
 const porEmpregado=new Map(contrachequesEmpresa.map(c=>[c.empregado_id,c]));
 const rota=`/folha/contracheques?competencia=${competencia}&cliente=${clienteId}`;
 const qtdPendentes=contrachequesEmpresa.filter(c=>c.situacao==='REPROCESSAMENTO_PENDENTE').length;
 const qtdConferidos=contrachequesEmpresa.filter(c=>c.situacao==='CONFERIDO').length;
 return <><CabecalhoPagina titulo="Processamento da folha por empresa" descricao="Selecione uma empresa e competência para gerar os contracheques de seus empregados." acao="Processar empresa" rotaAcao={`${rota}&novo=1`}/>
 <form action="/folha/contracheques" className="filtros"><Campo nome="cliente" rotulo="Empresa" padrao={clienteId} obrigatorio opcoes={clientes.map(c=>({valor:c.id,rotulo:c.razao_social}))}/><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={competencia} obrigatorio/><button className="botao" type="submit">Consultar</button><Link className="botao" href={`${rota}&parametros=1`}>Parâmetros 2026</Link><Link className="botao" href={`/folha/lancamentos?competencia=${competencia}&cliente=${clienteId}`}>Editar lançamentos</Link></form>
 <div className="grade colunas-4" style={{marginBottom:16}}><Indicador legenda="Empregados da empresa" valor={empregadosEmpresa.length}/><Indicador legenda="Contracheques gerados" valor={contrachequesEmpresa.length}/><Indicador legenda="Conferidos" valor={qtdConferidos}/><Indicador legenda="Reprocessamento pendente" valor={qtdPendentes}/></div>
 {!aprovadas&&<div className="mensagem">Parâmetros não aprovados para 2026. Revise as tabelas antes de calcular.</div>}
 <div className="aviso-configuracao">Somente folha mensal integral de empregados ativos. Férias, rescisões, 13º, admissões parciais e afastamentos continuam fora do cálculo automatizado. A reabertura preserva a necessidade de reprocessar antes de emitir novos PDFs.</div>
 <Cartao titulo={`Empregados e contracheques · ${empresa?.razao_social||'Selecione a empresa'} · ${formatarCompetencia(competencia)}`} acoes={<div className="linha" style={{gap:8}}><Link className="botao" href={`/folha/lancamentos?competencia=${competencia}&cliente=${clienteId}`}>Gerenciar eventos</Link>{contrachequesEmpresa.length>0&&<form action={async(dados:FormData)=>{'use server';await reabrirFolhaEmpresa(dados);}}><input type="hidden" name="cliente_id" value={clienteId}/><input type="hidden" name="competencia" value={competencia}/><BotaoConfirmar tipo="neutro" rotulo="Reabrir folha" mensagem="Reabrir todos os contracheques desta empresa? Os PDFs ficarão indisponíveis até o novo processamento."/></form>}</div>}>
 {empregadosEmpresa.length===0?<ListaVazia texto="Nenhum empregado cadastrado nesta empresa."/>:
 <div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Funcionário</th><th>Situação</th><th>Líquido</th><th>Contracheque</th><th>Ações</th></tr></thead><tbody>{empregadosEmpresa.map(e=>{const c=porEmpregado.get(e.id);const memoria=c?.memoria_calculo as unknown as MemoriaContracheque|undefined;return <tr key={e.id}><td>{e.nome_completo}</td><td><Etiqueta valor={e.situacao}/></td><td>{memoria&&c?.situacao!=='REPROCESSAMENTO_PENDENTE'?moeda(memoria.liquido):'—'}</td><td>{c?<Etiqueta valor={c.situacao}/>:<span className="muted">Não gerado</span>}</td><td><div className="acoes-registro"><Link className="botao" href={`/folha/lancamentos?competencia=${competencia}&cliente=${clienteId}`}>Editar eventos</Link>{c&&c.situacao!=='REPROCESSAMENTO_PENDENTE'&&<a className="botao" href={`/folha/contracheques/${c.id}/pdf`} target="_blank" rel="noopener noreferrer">PDF</a>}{c?.situacao==='EM_CONFERENCIA'&&<form action={confirmarContracheque}><input type="hidden" name="id" value={c.id}/><button type="submit" className="botao">Conferir</button></form>}</div></td></tr>})}</tbody></table></div>}
 </Cartao>
 {filtros.novo==='1'&&<JanelaModal titulo="Processar folha da empresa" descricao="Gera ou atualiza os contracheques dos empregados ativos elegíveis da empresa selecionada." fecharEm={rota} largura="ampla"><FormularioContinuo acao={processarFolhaEmpresa} modo="acao" className="grade-formulario"><Campo nome="cliente_id" rotulo="Empresa" obrigatorio padrao={clienteId} opcoes={clientes.map(c=>({valor:c.id,rotulo:c.razao_social}))}/><Campo nome="competencia" rotulo="Competência" tipo="month" obrigatorio padrao={competencia}/><div className="largo aviso-configuracao">Se algum empregado apresentar erro, os recibos anteriores à falha permanecerão processados; o sistema informará quantos foram concluídos.</div><div className="largo linha" style={{justifyContent:'flex-end'}}><button className="botao primario" type="submit">Processar empregados da empresa</button></div></FormularioContinuo></JanelaModal>}
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
