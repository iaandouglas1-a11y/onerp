import Link from 'next/link';
import { CabecalhoPagina,Cartao, ListaVazia,Campo } from '@/componentes/globais/elementos';
import { JanelaModal } from '@/componentes/globais/janela-modal';
import { FormularioContinuo } from '@/componentes/globais/formulario-continuo';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { BotaoDocumento } from '@/modulos/societario/componentes/acoes-arquivos';
import { enviarDocumento } from '@/modulos/societario/acoes';
import { listarClientes } from '@/modulos/societario/consultas';
export default async function Documentos({searchParams}:{searchParams:Promise<{novo?:string}>}){
  const {novo}=await searchParams;const {banco,escritorioId}=await exigirEscritorio();
  const [{data:documentos},clientes]=await Promise.all([banco.from('documentos').select('id,titulo,categoria,cliente_id').eq('escritorio_id',escritorioId).order('criado_em',{ascending:false}).limit(100),listarClientes()]);
  const nomes=Object.fromEntries(clientes.map(item=>[item.id,item.razao_social]));
  const podeEditar=true;
  return <><CabecalhoPagina titulo="Documentos" descricao="Arquivos privados vinculados aos clientes." acao={podeEditar?'Enviar documento':undefined} rotaAcao="/societario/documentos?novo=1"/>
    <Cartao titulo="Documentos recentes">{!documentos?.length?<ListaVazia/>:<div className="tabela-wrapper"><table className="tabela"><thead><tr><th>Documento</th><th>Cliente</th><th>Categoria</th><th>Ações</th></tr></thead><tbody>{documentos.map(item=><tr key={item.id}><td>{item.titulo}</td><td><Link href={`/societario/clientes/${item.cliente_id}?aba=documentos`}>{nomes[item.cliente_id]??'Cliente'}</Link></td><td>{item.categoria}</td><td><BotaoDocumento id={item.id}/></td></tr>)}</tbody></table></div>}</Cartao>
    {podeEditar&&novo==='1'&&<JanelaModal titulo="Enviar documento" fecharEm="/societario/documentos"><FormularioContinuo acao={enviarDocumento} className="grade"><Campo nome="cliente_id" rotulo="Cliente" obrigatorio opcoes={clientes.map(item=>({valor:item.id,rotulo:item.razao_social}))}/><Campo rotulo="Nome do documento" nome="titulo" obrigatorio/><Campo rotulo="Categoria" nome="categoria" padrao="CONTRATO"/><Campo rotulo="Validade" nome="data_validade" tipo="date"/><div className="campo"><label htmlFor="arquivo">Arquivo (PDF, imagem ou XML, até 10 MB)</label><input id="arquivo" type="file" name="arquivo" accept=".pdf,.jpg,.jpeg,.png,.xml,.txt" required/></div><button className="botao primario">Enviar documento</button></FormularioContinuo></JanelaModal>}
  </>;
}
