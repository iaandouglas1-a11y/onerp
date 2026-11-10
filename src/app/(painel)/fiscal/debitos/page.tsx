import Link from 'next/link';
import {CabecalhoPagina,Campo,Cartao,ListaVazia} from '@/componentes/globais/elementos';
import {JanelaModal} from '@/componentes/globais/janela-modal';
import {FormularioContinuo} from '@/componentes/globais/formulario-continuo';
import {dataBrasileira,formatarCompetencia,formatarDocumento,moeda} from '@/lib/utilitarios/formatacao';
import {salvarDebitoFiscal,excluirDebitoFiscal} from '@/modulos/fiscal/debitos/acoes';
import {calcularDebito,consolidarDebitos} from '@/modulos/fiscal/debitos/calculos';
import {consultarDebitosFiscais} from '@/modulos/fiscal/debitos/consultas';

export const dynamic='force-dynamic';
const TIPOS=[['DAS_MEI','DAS MEI'],['DAS_SIMPLES','DAS Simples Nacional'],['DARF','DARF'],['DCTFWEB','DCTFWeb'],['GPS','GPS'],['FGTS','FGTS'],['ISS','ISS'],['ICMS','ICMS'],['IPTU','IPTU'],['IPVA','IPVA'],['PARCELAMENTO','Parcelamento'],['MULTA','Multa'],['OUTRO','Outro']].map(([valor,rotulo])=>({valor,rotulo}));
const SITUACOES=[{valor:'ABERTO',rotulo:'Em aberto'},{valor:'PAGO',rotulo:'Pago'},{valor:'CANCELADO',rotulo:'Cancelado'}];
function hojeBrasil(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export default async function DebitosFiscais({searchParams}:{searchParams:Promise<{cliente?:string;novo?:string;editar?:string;excluir?:string}>}){
 const parametros=await searchParams;
 const {clientes,debitos,taxas}=await consultarDebitosFiscais();
 const selecionado=clientes.some(c=>c.id===parametros.cliente)?parametros.cliente:undefined;
 const listagem=selecionado?debitos.filter(d=>d.cliente_id===selecionado):debitos;
 const clientesPorId=new Map(clientes.map(c=>[c.id,c]));
 const hoje=hojeBrasil();const resumo=consolidarDebitos(listagem,taxas,hoje);
 const edicao=listagem.find(d=>d.id===parametros.editar);
 const exclusao=listagem.find(d=>d.id===parametros.excluir);
 const base=selecionado?`/fiscal/debitos?cliente=${selecionado}`:'/fiscal/debitos';
 const novo=base+(selecionado?'&':'?')+'novo=1';
 const urlPdf=`/fiscal/debitos/relatorio${selecionado?`?cliente=${encodeURIComponent(selecionado)}`:''}`;
 return <>
  <CabecalhoPagina titulo="Débitos fiscais" descricao="Controle de obrigações, vencimentos e acréscimos; emissão de relatório gerencial para o cliente."/>
  <Cartao titulo="Consulta de débitos" acoes={<div className="linha" style={{gap:8,flexWrap:'wrap',justifyContent:'flex-end'}}><Link href={novo} className="botao primario">+ Novo débito</Link>{selecionado?<Link href={urlPdf} className="botao">Exportar relatório</Link>:<button className="botao" type="button" disabled title="Selecione um cliente para exportar o relatório">Exportar relatório</button>}</div>}>
   <form method="get" className="linha" style={{alignItems:'end',flexWrap:'wrap',gap:12}}>
    <div className="campo" style={{minWidth:220,flex:'1 1 260px'}}><label htmlFor="cliente">Cliente</label><select id="cliente" name="cliente" defaultValue={selecionado??''}><option value="">Todos os clientes</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social} · {formatarDocumento(c.cpf_cnpj)}</option>)}</select></div>
    <button className="botao" type="submit">Aplicar</button>
   </form>
  </Cartao>
  <div className="grade colunas-3" style={{gap:14,marginTop:14,marginBottom:14,alignItems:'stretch'}}>
   <div className="cartao indicador" style={{borderTop:'4px solid #0A111C'}}><div className="legenda">Total de débitos em aberto</div><div className="valor">{moeda(resumo.totalPrincipal)}</div><div className="detalhe">{resumo.quantidade} débito(s) · valor principal</div></div>
   <div className="cartao indicador" style={{borderTop:'4px solid #D16050'}}><div className="legenda">Vencidos</div><div className="valor" style={{color:'#BE473A'}}>{moeda(resumo.vencidoPrincipal)}</div><div className="detalhe">{resumo.quantidadeVencidos} débito(s) · valor principal</div></div>
   <div className="cartao indicador" style={{borderTop:'4px solid #7CB93C'}}><div className="legenda">A vencer</div><div className="valor" style={{color:'#46751D'}}>{moeda(resumo.vencerPrincipal)}</div><div className="detalhe">{resumo.quantidadeVencer} débito(s) · valor principal</div></div>
  </div>
  <div style={{marginBottom:14}}><Cartao titulo="Total com acréscimos" subtitulo="O cálculo é atualizado ao consultar a página, conforme a data e as taxas Selic registradas.">
   <p style={{fontSize:20,fontWeight:650,marginBottom:6}}>{resumo.totalAtualizado===null?'Aguardando índices Selic':moeda(resumo.totalAtualizado)}</p>
   {resumo.incompletos>0&&<p className="mensagem erro">{resumo.incompletos} débito(s) possuem taxas Selic ausentes. O total atualizado não será exibido como definitivo.</p>}
   <p className="muted pequeno">Valores estimativos; a guia oficial prevalece. Débitos municipais, estaduais e parcelamentos podem exigir atualização específica ou lançamento manual de juros e multa.</p>
  </Cartao></div>
  <Cartao titulo={`Débitos registrados (${listagem.length})`}>
   {!listagem.length?<ListaVazia texto="Nenhum débito fiscal cadastrado para o filtro selecionado."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente / Débito</th><th>Tipo</th><th>Competência</th><th>Vencimento</th><th>Principal</th><th>Juros</th><th>Multa</th><th>Atualizado</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{listagem.map(d=>{const calc=calcularDebito(d,taxas,hoje);const situacao=d.situacao==='PAGO'?'Pago':d.situacao==='CANCELADO'?'Cancelado':calc.atrasado?'Vencido':'A vencer';return <tr key={d.id}>
    <td><strong>{clientesPorId.get(d.cliente_id)?.razao_social??'Cliente'}</strong><div className="muted pequeno">{d.descricao||TIPOS.find(t=>t.valor===d.tipo_debito)?.rotulo}</div></td><td>{TIPOS.find(t=>t.valor===d.tipo_debito)?.rotulo??d.tipo_debito}</td><td>{formatarCompetencia(d.competencia)}</td><td>{dataBrasileira(d.vencimento)}</td>
    <td>{moeda(d.valor_principal)}</td><td>{calc.juros===null?'Pendente':moeda(calc.juros)}</td><td>{calc.multa===null?'—':moeda(calc.multa)}</td><td title={calc.observacao}>{calc.total===null?'Pendente':moeda(calc.total)}</td><td>{situacao}</td>
    <td><div className="linha" style={{gap:6,flexWrap:'wrap'}}><Link className="botao" href={`${base}${selecionado?'&':'?'}editar=${d.id}`}>Editar</Link><Link className="botao" href={`${base}${selecionado?'&':'?'}excluir=${d.id}`}>Excluir</Link></div></td>
   </tr>})}</tbody></table></div>}
  </Cartao>
  {(parametros.novo==='1'||edicao)&&<JanelaModal titulo={edicao?'Editar débito':'Cadastrar débito fiscal'} descricao="Informe o valor principal e selecione a regra de atualização adequada ao débito." fecharEm={base} largura="ampla">
   <FormularioContinuo acao={salvarDebitoFiscal} modo={edicao?'edicao':'cadastro'} rotaNovoAposEdicao={base} className="grade colunas-2 debitos-formulario" manterCampos={['cliente_id']} focarClienteAposSalvar>
    {edicao&&<input type="hidden" name="id" value={edicao.id}/>}
    <Campo rotulo="Cliente" nome="cliente_id" obrigatorio padrao={edicao?.cliente_id??selecionado??''} opcoes={clientes.map(c=>({valor:c.id,rotulo:c.razao_social}))}/>
    <Campo rotulo="Tipo de débito" nome="tipo_debito" obrigatorio padrao={edicao?.tipo_debito??'DAS_MEI'} opcoes={TIPOS}/>
    <Campo rotulo="Competência" nome="competencia" tipo="month" padrao={edicao?.competencia?.slice(0,7)??''}/>
    <Campo rotulo="Vencimento" nome="vencimento" tipo="date" obrigatorio padrao={edicao?.vencimento??''}/>
    <Campo rotulo="Valor principal (R$)" nome="valor_principal" obrigatorio padrao={edicao?.valor_principal??''} placeholder="0,00"/>
    <Campo rotulo="Situação" nome="situacao" obrigatorio padrao={edicao?.situacao??'ABERTO'} opcoes={SITUACOES}/>
    <Campo rotulo="Data de pagamento (se pago)" nome="data_pagamento" tipo="date" padrao={edicao?.data_pagamento??''}/>
    <Campo rotulo="Valor efetivamente pago (R$)" nome="valor_pago" padrao={edicao?.valor_pago??''}/>
    <div className="debitos-observacoes"><Campo rotulo="Observações (opcional)" nome="observacoes" padrao={edicao?.observacoes??''} placeholder="Ex.: referência, processo ou acordo"/></div>
    <p className="debitos-nota muted pequeno">Multa e Selic são calculadas automaticamente para obrigações federais compatíveis. Tributos estaduais, municipais e parcelamentos exigem conferência com a guia oficial.</p>
    <div className="debitos-modal-acoes"><button type="submit" className="botao primario">{edicao?'Salvar alterações':'Salvar'}</button></div>
   </FormularioContinuo>
  </JanelaModal>}
  {exclusao&&<JanelaModal titulo="Excluir débito?" descricao={`O registro “${exclusao.descricao}” será excluído permanentemente.`} fecharEm={base}>
   <FormularioContinuo acao={excluirDebitoFiscal} modo="edicao" rotaNovoAposEdicao={base}>
    <input type="hidden" name="id" value={exclusao.id}/>
    <p>Confirme a exclusão deste débito. Esta ação não poderá ser desfeita.</p>
    <div className="linha" style={{marginTop:16,gap:12}}><Link href={base} className="botao">Cancelar</Link><button type="submit" className="botao perigo">Excluir débito</button></div>
   </FormularioContinuo>
  </JanelaModal>}
 </>;
}
