'use server';
import {revalidatePath} from 'next/cache';
import {exigirEdicao} from '@/lib/seguranca/contexto';
import {conferirErro} from '@/lib/utilitarios/erros';
import {limparTexto,textoObrigatorio,valorMonetarioBr} from '@/lib/utilitarios/formatacao';

const TIPO=['DAS_MEI','DAS_SIMPLES','DARF','DCTFWEB','GPS','FGTS','ISS','ICMS','IPTU','IPVA','PARCELAMENTO','MULTA','OUTRO'];
const TIPOS_FEDERAIS=['DAS_MEI','DAS_SIMPLES','DARF','DCTFWEB','GPS'];
const SITUACAO=['ABERTO','PAGO','CANCELADO'];
function ler(d:FormData,c:string){return limparTexto(d.get(c));}
function dataValida(valor:string,obrigatoria=false){if(!valor)return !obrigatoria;return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(valor)&&!Number.isNaN(Date.parse(valor));}
function decimal(d:FormData,campo:string,obrigatorio=false){const texto=ler(d,campo);if(!texto&&!obrigatorio)return 0;const valor=valorMonetarioBr(texto);if(!Number.isFinite(valor)||valor<0||valor>9999999999999)throw new Error(`${campo}: informe valor monetário não negativo.`);return valor;}
export async function salvarDebitoFiscal(dados:FormData){
 const {banco,escritorioId,usuario}=await exigirEdicao();
 const id=ler(dados,'id');const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
 const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id').eq('escritorio_id',escritorioId).eq('id',clienteId).maybeSingle();
 conferirErro(erroCliente,'Consultar cliente');if(!cliente)throw new Error('Cliente não vinculado ao escritório.');
 const tipo=ler(dados,'tipo_debito'),situacao=ler(dados,'situacao');
 if(!TIPO.includes(tipo)||!SITUACAO.includes(situacao))throw new Error('Tipo ou situação inválida.');
 const criterio=TIPOS_FEDERAIS.includes(tipo)?'FEDERAL_MORA':'SEM_ATUALIZACAO';
 const vencimento=ler(dados,'vencimento'),competencia=ler(dados,'competencia'),pagamento=ler(dados,'data_pagamento');
 if(!dataValida(vencimento,true)||!dataValida(pagamento)||competencia&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia))throw new Error('Confira as datas informadas.');
 if(situacao==='PAGO'&&(!pagamento||!ler(dados,'valor_pago')))throw new Error('Informe a data e o valor efetivamente pagos.');
 const registro={cliente_id:clienteId,descricao:tipo.replaceAll('_',' '),tipo_debito:tipo,
  numero_referencia:null,competencia:competencia?`${competencia}-01`:null,
  vencimento,valor_principal:decimal(dados,'valor_principal',true),criterio_atualizacao:criterio,
  juros_manual:0,
  multa_manual:0,
  data_referencia_manual:null,
  situacao,data_pagamento:situacao==='PAGO'?pagamento:null,
  valor_pago:situacao==='PAGO'?decimal(dados,'valor_pago',true):null,
  observacoes:ler(dados,'observacoes')||null,atualizado_em:new Date().toISOString()};
 if(id){
  const {data:existe,error:erroConsulta}=await banco.from('debitos_fiscais').select('id').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
  conferirErro(erroConsulta,'Localizar débito');if(!existe)throw new Error('Débito não encontrado.');
  const {data,error}=await banco.from('debitos_fiscais').update(registro).eq('escritorio_id',escritorioId).eq('id',id).select('id');
  conferirErro(error,'Atualizar débito');if(!data?.length)throw new Error('A atualização não foi autorizada.');
 }else{
  const {error}=await banco.from('debitos_fiscais').insert({...registro,escritorio_id:escritorioId,criado_por:usuario.id});
  conferirErro(error,'Registrar débito');
 }
 revalidatePath('/fiscal/debitos');return {sucesso:true,mensagem:id?'Débito atualizado com sucesso.':'Débito cadastrado com sucesso.'};
}
export async function excluirDebitoFiscal(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const id=textoObrigatorio(dados.get('id'),'Débito');
 const {data,error}=await banco.from('debitos_fiscais').delete().eq('escritorio_id',escritorioId).eq('id',id).select('id');
 conferirErro(error,'Excluir débito');if(!data?.length)throw new Error('Débito não encontrado ou operação não autorizada.');
 revalidatePath('/fiscal/debitos');return {sucesso:true,mensagem:'Débito excluído.'};
}
