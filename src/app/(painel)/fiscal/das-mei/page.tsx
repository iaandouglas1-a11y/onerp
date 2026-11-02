import Link from 'next/link';
import {CabecalhoPagina,Cartao,Campo,ListaVazia,rotuloSituacao} from '@/componentes/globais/elementos';
import {JanelaModal} from '@/componentes/globais/janela-modal';
import {FormularioContinuo} from '@/componentes/globais/formulario-continuo';
import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {consultarTodasPaginas} from '@/lib/utilitarios/paginacao';
import {formatarDocumento,formatarCompetencia,dataBrasileira,moeda,mesAtual} from '@/lib/utilitarios/formatacao';
import {registrarDasMei} from '@/modulos/fiscal/operacoes-documentais';

type Cliente={id:string;razao_social:string;cpf_cnpj:string;regime_tributario:string|null};
type Guia={id:string;cliente_id:string;competencia:string;situacao:string;valor:number|null;data_vencimento:string|null;data_pagamento:string|null;caminho_guia:string|null};
export default async function DasMei({searchParams}:{searchParams:Promise<{novo?:string}>}){
  const filtros=await searchParams;
  const {banco,escritorioId}=await exigirEscritorio();
  const [clientes,guias]=await Promise.all([
    consultarTodasPaginas<Cliente>((inicio,fim)=>banco.from('clientes').select('id,razao_social,cpf_cnpj,regime_tributario').eq('escritorio_id',escritorioId).eq('regime_tributario','MEI').order('razao_social').range(inicio,fim)),
    consultarTodasPaginas<Guia>((inicio,fim)=>banco.from('competencias_das_mei').select('id,cliente_id,competencia,situacao,valor,data_vencimento,data_pagamento,caminho_guia').eq('escritorio_id',escritorioId).order('competencia',{ascending:false}).range(inicio,fim))
  ]);
  const mapa=new Map(clientes.map(item=>[item.id,item.razao_social]));
  return <><CabecalhoPagina titulo="DAS MEI" descricao="Acompanhamento de competências e guias oficiais do PGMEI." acao="Registrar DAS" rotaAcao="/fiscal/das-mei?novo=1"/>
  <Cartao titulo="Emissão oficial assistida" subtitulo="O DAS é gerado pelo PGMEI. Anexe o documento emitido e acompanhe sua situação aqui.">
    <p>O On ERP organiza as competências, vencimentos, PDFs e pagamentos informados. <strong>A emissão integrada pelo Serpro Integra Contador depende de contratação, autorização e configuração ainda não habilitadas nesta versão.</strong></p>
    <div className="linha" style={{marginTop:12}}><a className="botao primario" href="https://www.gov.br/pt-br/servicos/emitir-das-para-pagamento-de-tributos-do-mei" target="_blank" rel="noopener noreferrer">Abrir serviço oficial PGMEI</a> <a className="botao" href="https://apicenter.estaleiro.serpro.gov.br/documentacao/api-integra-contador/pt/solucoes/integra-mei/pgmei/servicos/gerar_das/" target="_blank" rel="noopener noreferrer">Documentação da integração Serpro</a></div>
  </Cartao>
  {filtros.novo==='1'&&<JanelaModal titulo="Registrar competência / anexar DAS" descricao="Informe os dados confirmados no portal oficial." fecharEm="/fiscal/das-mei">
    <FormularioContinuo acao={registrarDasMei} modo="cadastro" className="grade colunas-2">
      <Campo rotulo="Cliente MEI" nome="cliente_id" obrigatorio opcoes={clientes.map(item=>({valor:item.id,rotulo:`${item.razao_social} · ${formatarDocumento(item.cpf_cnpj)}`}))}/>
      <Campo rotulo="Competência" nome="competencia" tipo="month" padrao={mesAtual()} obrigatorio/>
      <Campo rotulo="Situação" nome="situacao" obrigatorio opcoes={[
        {valor:'PENDENTE',rotulo:'Pendente'},{valor:'EMITIDO_EXTERNAMENTE',rotulo:'Emitido no PGMEI'},
        {valor:'PAGO',rotulo:'Pago (confirmado)'},{valor:'VENCIDO',rotulo:'Vencido'},{valor:'NAO_APLICAVEL',rotulo:'Não aplicável'}]}/>
      <Campo rotulo="Valor oficial (R$)" nome="valor" placeholder="80,90"/>
      <Campo rotulo="Vencimento" nome="data_vencimento" tipo="date"/>
      <Campo rotulo="Pagamento confirmado em" nome="data_pagamento" tipo="date"/>
      <Campo rotulo="Identificador oficial (opcional)" nome="referencia_externa"/>
      <div className="campo"><label htmlFor="guia-pdf">PDF oficial do DAS (até 8 MB)</label><input id="guia-pdf" name="guia" type="file" accept=".pdf,application/pdf"/></div>
      <div><button type="submit" className="botao primario">Salvar</button></div>
    </FormularioContinuo>
    <p className="muted pequeno" style={{marginTop:12}}>O valor e a situação devem refletir o PGMEI. Não há cálculo automático de multa, juros ou quitação bancária no On ERP.</p>
  </JanelaModal>}
  <Cartao titulo={`Competências registradas (${guias.length})`}>
    {!guias.length?<ListaVazia texto="Nenhuma competência DAS cadastrada."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente</th><th>Competência</th><th>Situação</th><th>Vencimento</th><th>Valor</th><th>Pagamento</th><th>Guia</th></tr></thead><tbody>{guias.map(guia=><tr key={guia.id}>
      <td>{mapa.get(guia.cliente_id)??'—'}</td><td>{formatarCompetencia(guia.competencia)}</td><td>{rotuloSituacao(guia.situacao)}</td>
      <td>{dataBrasileira(guia.data_vencimento)}</td><td>{guia.valor===null?'—':moeda(guia.valor)}</td><td>{dataBrasileira(guia.data_pagamento)}</td>
      <td>{guia.caminho_guia?<a className="botao" href={`/fiscal/arquivos/das/${guia.id}`} target="_blank" rel="noopener noreferrer">Abrir PDF</a>:'—'}</td>
    </tr>)}</tbody></table></div>}
  </Cartao></>;
}
