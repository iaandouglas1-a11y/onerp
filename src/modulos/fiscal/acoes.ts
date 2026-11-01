'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirAdministrador, exigirEdicao } from '@/lib/seguranca/contexto';
import { conferirErro } from '@/lib/utilitarios/erros';
import { limparTexto,normalizarData,textoObrigatorio,valorMonetarioBr } from '@/lib/utilitarios/formatacao';
function ler(dados:FormData,nome:string){return limparTexto(dados.get(nome));}
async function montarMovimento(dados:FormData) {
  const tipo_movimento=ler(dados,'tipo_movimento');
  if(!['RECEITA','ENTRADA','DESPESA'].includes(tipo_movimento))throw new Error('Tipo de movimento inválido.');
  const atividade_receita=ler(dados,'atividade_receita')||null;
  if(atividade_receita&&!['COMERCIO','INDUSTRIA','SERVICOS','OUTROS'].includes(atividade_receita))throw new Error('Atividade inválida.');
  const data_movimento=textoObrigatorio(dados.get('data_movimento'),'Data');
  const competencia=textoObrigatorio(dados.get('competencia'),'Competência');
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia))throw new Error('Competência inválida.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(data_movimento))throw new Error('Data de movimento inválida.');
  const valor=valorMonetarioBr(ler(dados,'valor'));
  if(valor<0)throw new Error('Informe um valor maior ou igual a zero.');
  return {tipo_movimento,atividade_receita:tipo_movimento==='RECEITA'?atividade_receita:null,
    data_movimento,competencia:`${competencia}-01`,descricao:ler(dados,'descricao')||null,numero_documento:ler(dados,'numero_documento')||null,valor};
}
export async function salvarMovimentoFiscal(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirEdicao();
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id,regime_tributario').eq('id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
  if(erroCliente||!cliente)throw new Error('Cliente inexistente ou pertencente a outro escritório.');
  const movimento=await montarMovimento(dados);
  if(cliente.regime_tributario==='MEI'&&movimento.tipo_movimento==='RECEITA'&&!movimento.atividade_receita)throw new Error('Classifique a atividade da receita MEI.');
  const categoriaId=ler(dados,'categoria_id');
  if(categoriaId){const {data:categoria}=await banco.from('categorias_fiscais').select('id,tipo_movimento').eq('id',categoriaId).eq('escritorio_id',escritorioId).maybeSingle();if(!categoria||categoria.tipo_movimento!==movimento.tipo_movimento)throw new Error('Categoria incompatível com o tipo de movimento.');}
  const id=ler(dados,'id');
  if(id){
    const {data:existente,error:erroExistente}=await banco.from('movimentacoes_fiscais').select('id,origem,cliente_id').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
    conferirErro(erroExistente,'Consultar lançamento');
    if(!existente||existente.cliente_id!==clienteId)throw new Error('Lançamento não encontrado para este cliente.');
    if(existente.origem!=='MANUAL')throw new Error('Lançamentos importados devem ser corrigidos por sua rotina de origem.');
    const {error:erro}=await banco.from('movimentacoes_fiscais').update({...movimento,cliente_id:clienteId,categoria_id:categoriaId||null}).eq('id',id).eq('escritorio_id',escritorioId);
    conferirErro(erro,'Atualizar movimento');
  }else{
    const {error:erro}=await banco.from('movimentacoes_fiscais').insert({...movimento,cliente_id:clienteId,categoria_id:categoriaId||null,escritorio_id:escritorioId,criado_por:usuario.id,origem:'MANUAL'});
    conferirErro(erro,'Incluir movimento');
  }
  revalidatePath('/fiscal/faturamento');revalidatePath('/fiscal/faturamento/mei');revalidatePath('/fiscal/faturamento/convencional');
  redirect(`/fiscal/faturamento${cliente.regime_tributario==='MEI'?`/mei?cliente=${clienteId}`:'/convencional'}`);
}
export async function criarCategoriaFiscal(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const tipo=ler(dados,'tipo_movimento');if(!['RECEITA','ENTRADA','DESPESA'].includes(tipo))throw new Error('Tipo inválido.');
  const {error:erro}=await banco.from('categorias_fiscais').insert({escritorio_id:escritorioId,nome:textoObrigatorio(dados.get('nome'),'Nome'),tipo_movimento:tipo});
  conferirErro(erro);revalidatePath('/fiscal/categorias');redirect('/fiscal/categorias');
}
export async function configurarLimiteMei(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirAdministrador();
  const ano=Number(ler(dados,'ano_calendario'));const limite=valorMonetarioBr(ler(dados,'limite_anual'));
  const percentual=Number(ler(dados,'percentual_alerta'))/100;
  if(ano<2000||ano>2200||!Number.isInteger(ano))throw new Error('Ano inválido.');
  if(limite<=0)throw new Error('Limite anual deve ser positivo.');
  if(!Number.isFinite(percentual)||percentual<0||percentual>1)throw new Error('Percentual de alerta inválido.');
  const fundamento=textoObrigatorio(dados.get('fundamento_legal'),'Fundamento legal');
  const {error:erro}=await banco.from('regras_limites_mei').upsert({escritorio_id:escritorioId,ano_calendario:ano,limite_anual:limite,proporcional_ano_abertura:dados.get('proporcional_ano_abertura')==='on',percentual_alerta:percentual,
    fundamento_legal:fundamento,aprovado_por:usuario.id,aprovado_em:new Date().toISOString()},{onConflict:'escritorio_id,ano_calendario'});
  conferirErro(erro,'Configurar regra MEI');revalidatePath('/fiscal/faturamento/mei');redirect('/configuracoes');
}
export async function registrarAjusteMei(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirAdministrador();
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');const competencia=textoObrigatorio(dados.get('competencia'),'Competência');
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia))throw new Error('Competência inválida.');
  const {data:cliente}=await banco.from('clientes').select('regime_tributario').eq('id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
  if(cliente?.regime_tributario!=='MEI')throw new Error('Ajustes MEI exigem um cliente MEI.');
  const valor=valorMonetarioBr(ler(dados,'valor'));
  if(valor===0)throw new Error('Informe valor diferente de zero.');
  const {error:erro}=await banco.from('ajustes_faturamento_mei').insert({escritorio_id:escritorioId,cliente_id:clienteId,competencia:`${competencia}-01`,valor,justificativa:textoObrigatorio(dados.get('justificativa'),'Justificativa'),criado_por:usuario.id});
  conferirErro(erro);revalidatePath('/fiscal/faturamento/mei');redirect(`/fiscal/faturamento/mei?cliente=${clienteId}`);
}

export async function excluirMovimentoFiscal(dados:FormData){
  const {banco,escritorioId}=await exigirAdministrador();
  const id=textoObrigatorio(dados.get('id'),'Lançamento');
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  const {data:registro,error:erroConsulta}=await banco.from('movimentacoes_fiscais').select('id,origem,cliente_id').eq('id',id).eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).maybeSingle();
  conferirErro(erroConsulta,'Localizar lançamento');
  if(!registro)throw new Error('Lançamento não encontrado no cliente informado.');
  if(registro.origem!=='MANUAL')throw new Error('Lançamentos importados não podem ser excluídos por esta tela.');
  const {data,error:erro}=await banco.from('movimentacoes_fiscais').delete().eq('id',id).eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('origem','MANUAL').select('id');
  conferirErro(erro,'Excluir lançamento');
  if(!data?.length)throw new Error('Não foi possível excluir o lançamento. Verifique as permissões.');
  revalidatePath('/fiscal/faturamento');revalidatePath('/fiscal/faturamento/mei');revalidatePath('/fiscal/faturamento/convencional');revalidatePath('/inicio');
  const {data:cliente}=await banco.from('clientes').select('regime_tributario').eq('id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
  redirect(cliente?.regime_tributario==='MEI'?`/fiscal/faturamento/mei?cliente=${clienteId}`:'/fiscal/faturamento/convencional');
}
