import {CabecalhoPagina,Cartao,Campo,ListaVazia,rotuloSituacao} from '@/componentes/globais/elementos';
import {JanelaModal} from '@/componentes/globais/janela-modal';
import Link from 'next/link';
import {FormularioContinuo} from '@/componentes/globais/formulario-continuo';
import {exigirEscritorio} from '@/lib/seguranca/contexto';
import {consultarTodasPaginas} from '@/lib/utilitarios/paginacao';
import {formatarDocumento,dataBrasileira,moeda} from '@/lib/utilitarios/formatacao';
import {salvarDeclaracaoMei} from '@/modulos/fiscal/operacoes-documentais';

type Cliente={id:string;razao_social:string;cpf_cnpj:string;regime_tributario:string|null};
type Receita={cliente_id:string;tipo_movimento:string;atividade_receita:string|null;valor:number;competencia:string};
type Ajuste={cliente_id:string;competencia:string;valor:number};
type Declaracao={id:string;cliente_id:string;ano_calendario:number;receita_comercio:number;receita_servicos:number;teve_empregado_no_ano:boolean|null;situacao:string;data_declaracao:string|null;caminho_recibo:string|null};
export default async function DasnSimei({searchParams}:{searchParams:Promise<{ano?:string;cliente?:string;editar?:string}>}){
  const filtro=await searchParams;
  const ano=/^20\d{2}$/.test(filtro.ano??'')?Number(filtro.ano):new Date().getFullYear()-1;
  const {banco,escritorioId}=await exigirEscritorio();
  const [clientes,receitas,ajustes,declaracoes]=await Promise.all([
    consultarTodasPaginas<Cliente>((inicio,fim)=>banco.from('clientes').select('id,razao_social,cpf_cnpj,regime_tributario').eq('escritorio_id',escritorioId).eq('regime_tributario','MEI').order('razao_social').range(inicio,fim)),
    consultarTodasPaginas<Receita>((inicio,fim)=>banco.from('movimentacoes_fiscais').select('cliente_id,tipo_movimento,atividade_receita,valor,competencia').eq('escritorio_id',escritorioId).eq('tipo_movimento','RECEITA').gte('competencia',`${ano}-01-01`).lte('competencia',`${ano}-12-01`).order('id').range(inicio,fim)),
    consultarTodasPaginas<Ajuste>((inicio,fim)=>banco.from('ajustes_faturamento_mei').select('cliente_id,competencia,valor').eq('escritorio_id',escritorioId).gte('competencia',`${ano}-01-01`).lte('competencia',`${ano}-12-01`).order('id').range(inicio,fim)),
    consultarTodasPaginas<Declaracao>((inicio,fim)=>banco.from('declaracoes_anuais_mei').select('id,cliente_id,ano_calendario,receita_comercio,receita_servicos,teve_empregado_no_ano,situacao,data_declaracao,caminho_recibo').eq('escritorio_id',escritorioId).eq('ano_calendario',ano).order('id').range(inicio,fim))
  ]);
  const escolhido=clientes.find(item=>item.id===filtro.cliente)??clientes[0];
  const propostas=receitas.filter(item=>item.cliente_id===escolhido?.id);
  const soma=(atividades:string[])=>propostas.filter(item=>atividades.includes(item.atividade_receita||'')).reduce((soma,item)=>soma+Number(item.valor),0);
  const comercio=soma(['COMERCIO','INDUSTRIA']);const servicos=soma(['SERVICOS']);const semClassificacao=soma(['OUTROS','']);
  const ajusteAnual=ajustes.filter(item=>item.cliente_id===escolhido?.id).reduce((soma,item)=>soma+Number(item.valor),0);
  const atual=declaracoes.find(item=>item.cliente_id===escolhido?.id);
  const nomes=new Map(clientes.map(item=>[item.id,item.razao_social]));
  return <><CabecalhoPagina titulo="DASN-SIMEI" descricao="Preparação anual, conferência e registro da entrega oficial."/>
    <Cartao titulo="Serviço oficial da Receita Federal"><p>A declaração será preparada com apoio dos registros do On ERP. A <strong>transmissão é feita no sistema oficial DASN-SIMEI</strong>; o On ERP não transmite declarações automaticamente.</p>
      <div className="linha" style={{marginTop:12}}><a className="botao primario" href="https://www.gov.br/pt-br/servicos/declarar-receita-bruta-anual-para-o-mei" target="_blank" rel="noopener noreferrer">Abrir DASN-SIMEI oficial</a></div>
    </Cartao>
    <form action="/fiscal/dasn-simei" className="filtros">
      <div className="campo"><label htmlFor="dasn-ano">Ano-calendário</label><input id="dasn-ano" name="ano" type="number" min="2010" max="2200" defaultValue={ano}/></div>
      <div className="campo" style={{minWidth:250,flex:1}}><label htmlFor="dasn-cliente">Cliente MEI</label><select id="dasn-cliente" name="cliente" defaultValue={escolhido?.id||''}>{clientes.map(item=><option key={item.id} value={item.id}>{item.razao_social}</option>)}</select></div>
      <button type="submit" className="botao">Consultar</button>
    </form>
    {!escolhido?<Cartao><ListaVazia texto="Cadastre um cliente MEI para preparar a declaração."/></Cartao>:<>
      <Cartao titulo={`Conferência de receitas — ${ano}`} subtitulo={`${escolhido.razao_social} · ${formatarDocumento(escolhido.cpf_cnpj)}`}>
        <div className="grade colunas-3"><div className="metrica-lista"><span>Comércio e indústria</span><strong>{moeda(comercio)}</strong></div><div className="metrica-lista"><span>Serviços</span><strong>{moeda(servicos)}</strong></div><div className="metrica-lista"><span>Sem classificação / ajustes</span><strong>{moeda(semClassificacao+ajusteAnual)}</strong></div></div>
        <p className="muted pequeno" style={{marginTop:12}}>Prévia baseada apenas nos lançamentos manuais registrados. XMLs importados não são incorporados automaticamente ao faturamento. Ajustes e receitas não classificados devem ser conciliados antes da declaração; valores oficiais precisam ser confirmados pelo responsável.</p>
      </Cartao>
      <div className="linha" style={{marginBottom:15}}><Link href={`/fiscal/dasn-simei?ano=${ano}&cliente=${escolhido.id}&editar=1`} className="botao primario">{atual?'Atualizar declaração':'Preparar declaração'}</Link></div>
      {filtro.editar==='1'&&<JanelaModal titulo={atual?'Atualizar declaração':'Preparar declaração'} descricao="Os dados devem ser conferidos antes da transmissão oficial." fecharEm={`/fiscal/dasn-simei?ano=${ano}&cliente=${escolhido.id}`}>
        <FormularioContinuo acao={salvarDeclaracaoMei} modo="acao" className="grade colunas-2">
          <input type="hidden" name="cliente_id" value={escolhido.id}/><input type="hidden" name="ano_calendario" value={ano}/>
          <Campo nome="receita_comercio" rotulo="Receita anual — comércio e indústria (R$)" padrao={atual?.receita_comercio??comercio} obrigatorio/>
          <Campo nome="receita_servicos" rotulo="Receita anual — serviços (R$)" padrao={atual?.receita_servicos??servicos} obrigatorio/>
          <div className="campo"><label htmlFor="dasn-empregado">Teve empregado no ano? *</label><select id="dasn-empregado" name="teve_empregado_no_ano" required defaultValue={atual?.teve_empregado_no_ano===null||!atual?'':atual.teve_empregado_no_ano?'SIM':'NAO'}><option value="">Selecione</option><option value="SIM">Sim</option><option value="NAO">Não</option></select></div>
          <Campo padrao={atual?.situacao??'EM_PREPARACAO'} nome="situacao" rotulo="Situação da declaração" obrigatorio opcoes={[
            {valor:'EM_PREPARACAO',rotulo:'Em preparação'},{valor:'CONFERIDA',rotulo:'Conferida, não transmitida'},
            {valor:'DECLARADA_EXTERNAMENTE',rotulo:'Transmitida no portal oficial'}]}/>
          <Campo nome="data_declaracao" rotulo="Data da transmissão (se aplicável)" tipo="date" padrao={atual?.data_declaracao}/>
          <div className="campo"><label htmlFor="recibo-dasn">Recibo oficial de entrega (PDF)</label><input id="recibo-dasn" type="file" name="recibo" accept=".pdf,application/pdf"/></div>
          <div><button type="submit" className="botao primario">Salvar</button></div>
        </FormularioContinuo>
        <p className="muted pequeno" style={{marginTop:12}}>A marcação de transmissão exige a data e o recibo oficial. Os valores informados neste formulário são dados de conferência e não representam transmissão ao governo.</p>
      </JanelaModal>}
    </>}
    <Cartao titulo={`Declarações acompanhadas — ${ano}`}>
      {!declaracoes.length?<ListaVazia texto="Nenhuma declaração cadastrada para o ano selecionado."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente</th><th>Comércio</th><th>Serviços</th><th>Empregado</th><th>Situação</th><th>Transmissão</th><th>Recibo</th></tr></thead><tbody>{declaracoes.map(item=><tr key={item.id}>
        <td>{nomes.get(item.cliente_id)??'—'}</td><td>{moeda(item.receita_comercio)}</td><td>{moeda(item.receita_servicos)}</td>
        <td>{item.teve_empregado_no_ano===null?'Não informado':item.teve_empregado_no_ano?'Sim':'Não'}</td>
        <td>{rotuloSituacao(item.situacao)}</td><td>{dataBrasileira(item.data_declaracao)}</td>
        <td>{item.caminho_recibo?<a className="botao" href={`/fiscal/arquivos/dasn/${item.id}`} target="_blank" rel="noopener noreferrer">Abrir PDF</a>:'—'}</td>
      </tr>)}</tbody></table></div>}
    </Cartao>
  </>;
}
