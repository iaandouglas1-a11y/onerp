import Link from 'next/link';
import { CabecalhoPagina, Cartao, ListaVazia } from '@/componentes/globais/elementos';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';
import { dataBrasileira,formatarDocumento,moeda } from '@/lib/utilitarios/formatacao';
import { importarXmlFiscal } from '@/modulos/fiscal/operacoes-documentais';

type Documento={id:string;cliente_id:string;tipo_documento:string;direcao:string;numero_documento:string|null;data_emissao:string|null;valor_total:number|null;validacao_xml:string;caminho_arquivo:string|null;cpf_cnpj_emitente:string|null;cpf_cnpj_destinatario:string|null};
type Cliente={id:string;razao_social:string;cpf_cnpj:string};
const tipos:Record<string,string>={NFE:'NF-e',NFCE:'NFC-e',NFSE:'NFS-e',CTE:'CT-e',OUTRO:'TC / Outro'};
export default async function DocumentosFiscais({searchParams}:{searchParams:Promise<{cliente?:string;direcao?:string;novo?:string}>}){
  const filtro=await searchParams;const {banco,escritorioId}=await exigirEscritorio();
  const [clientes,documentos]=await Promise.all([
    consultarTodasPaginas<Cliente>((inicio,fim)=>banco.from('clientes').select('id,razao_social,cpf_cnpj').eq('escritorio_id',escritorioId).order('razao_social').range(inicio,fim)),
    consultarTodasPaginas<Documento>((inicio,fim)=>{
      let consulta=banco.from('documentos_fiscais').select('id,cliente_id,tipo_documento,direcao,numero_documento,data_emissao,valor_total,validacao_xml,caminho_arquivo,cpf_cnpj_emitente,cpf_cnpj_destinatario').eq('escritorio_id',escritorioId);
      if(filtro.cliente)consulta=consulta.eq('cliente_id',filtro.cliente);
      if(['ENTRADA','SAIDA'].includes(filtro.direcao||''))consulta=consulta.eq('direcao',filtro.direcao!);
      return consulta.order('importado_em',{ascending:false}).range(inicio,fim);
    })
  ]);
  const mapa=new Map(clientes.map(item=>[item.id,item]));
  return <>
    <CabecalhoPagina titulo="Documentos fiscais" descricao="Importação e conferência de XMLs de entrada e saída. Não representa consulta de autenticidade na SEFAZ." acao="Importar XML" rotaAcao="/fiscal/documentos?novo=1"/>
    {filtro.novo==='1'&&<JanelaModal titulo="Importar XML" descricao="NF-e, NFC-e, NFS-e e CT-e. TC requer conferência manual do leiaute." fecharEm="/fiscal/documentos">
      <FormularioContinuo acao={importarXmlFiscal} className="filtros" modo="cadastro">
        <div className="campo" style={{minWidth:220,flex:'2 1 220px'}}><label htmlFor="importar-cliente">Cliente *</label><select id="importar-cliente" name="cliente_id" required><option value="">Selecione</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social} — {formatarDocumento(c.cpf_cnpj)}</option>)}</select></div>
        <div className="campo"><label htmlFor="direcao-importar">Operação *</label><select id="direcao-importar" name="direcao" required><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></select></div>
        <div className="campo"><label htmlFor="tipo-generico">Tipo especial</label><select id="tipo-generico" name="tipo_generico"><option value="">Reconhecimento automático</option><option value="TC">TC / XML genérico</option></select></div>
        <div className="campo" style={{flex:'2 1 200px'}}><label htmlFor="xml-fiscal">Arquivo XML *</label><input id="xml-fiscal" name="arquivo" type="file" accept=".xml,text/xml,application/xml" required/></div>
        <button className="botao primario" type="submit">Importar XML</button>
      </FormularioContinuo>
      <p className="muted pequeno" style={{marginTop:12}}>Máximo de 5 MB por arquivo. O sistema confere o formato, identifica duplicidades e armazena o XML em área privada. A importação não gera lançamentos de faturamento automaticamente; documentos sem protocolo ou com leiaute genérico exigem conferência.</p>
    </JanelaModal>}
    <Cartao titulo={`Documentos importados (${documentos.length})`}>
      <form className="filtros" action="/fiscal/documentos" style={{marginBottom:16}}>
        <div className="campo"><label>Cliente</label><select name="cliente" defaultValue={filtro.cliente||''}><option value="">Todos os clientes</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razao_social}</option>)}</select></div>
        <div className="campo"><label>Operação</label><select name="direcao" defaultValue={filtro.direcao||''}><option value="">Entradas e saídas</option><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option></select></div>
        <button className="botao" type="submit">Filtrar</button><Link className="botao" href="/fiscal/documentos">Limpar</Link>
      </form>
      {!documentos.length?<ListaVazia texto="Nenhum documento fiscal encontrado."/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Cliente</th><th>Tipo</th><th>Operação</th><th>Número</th><th>Emissão</th><th>Valor</th><th>Validação</th><th>Arquivo</th></tr></thead><tbody>{documentos.map(item=><tr key={item.id}>
        <td>{mapa.get(item.cliente_id)?.razao_social??'—'}</td><td>{tipos[item.tipo_documento]??item.tipo_documento}</td><td>{item.direcao==='ENTRADA'?'Entrada':'Saída'}</td>
        <td>{item.numero_documento??'—'}</td><td>{dataBrasileira(item.data_emissao)}</td><td>{item.valor_total===null?'A conferir':moeda(item.valor_total)}</td>
        <td>{item.validacao_xml==='ESTRUTURA_RECONHECIDA'?'Estrutura reconhecida':'Conferência necessária'}</td>
        <td>{item.caminho_arquivo?<a href={`/fiscal/arquivos/xml/${item.id}`} className="botao" target="_blank" rel="noopener noreferrer">Abrir XML</a>:'—'}</td>
      </tr>)}</tbody></table></div>}
    </Cartao>
  </>;
}
