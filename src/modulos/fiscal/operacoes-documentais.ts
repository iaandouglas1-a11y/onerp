'use server';
import { revalidatePath } from 'next/cache';
import { createHash, randomUUID } from 'node:crypto';
import { exigirEdicao, exigirEscritorio } from '@/lib/seguranca/contexto';
import { conferirErro } from '@/lib/utilitarios/erros';
import { digitos, textoObrigatorio, valorMonetarioBr } from '@/lib/utilitarios/formatacao';
import { interpretarDocumentoFiscal } from './documentos/interpretar-xml';

const BUCKET='on-erp-private';
const LIMITE_XML=5*1024*1024;
const LIMITE_PDF=8*1024*1024;
const seguro=(valor:FormDataEntryValue|null)=>String(valor??'').trim();
const validarUuid=(valor:string,nome:string)=>{if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(valor))throw new Error(`${nome} inválido.`);return valor;};

async function exigirCliente(clienteId:string,mei=false) {
  const contexto=await exigirEdicao();
  validarUuid(clienteId,'Cliente');
  const {data:cliente,error:erro}=await contexto.banco.from('clientes').select('id,cpf_cnpj,razao_social,regime_tributario')
    .eq('escritorio_id',contexto.escritorioId).eq('id',clienteId).maybeSingle();
  conferirErro(erro,'Consultar cliente');
  if(!cliente)throw new Error('Cliente não encontrado no escritório.');
  if(mei && cliente.regime_tributario!=='MEI')throw new Error('Selecione um cliente optante pelo MEI.');
  return {...contexto,cliente};
}
function exigirArquivo(dados:FormData,nome:string,tipo:'xml'|'pdf'){
  const arquivo=dados.get(nome);
  if(!(arquivo instanceof File)||!arquivo.size)throw new Error('Selecione um arquivo para continuar.');
  if(arquivo.size>(tipo==='xml'?LIMITE_XML:LIMITE_PDF))throw new Error(`O arquivo deve ter até ${tipo==='xml'?5:8} MB.`);
  if(!arquivo.name.toLowerCase().endsWith(`.${tipo}`))throw new Error(`Envie um arquivo .${tipo}.`);
  return arquivo;
}
async function armazenarArquivo(banco:Awaited<ReturnType<typeof exigirEdicao>>['banco'],pasta:string,arquivo:File,tipo:'xml'|'pdf'){
  const caminho=`${pasta}/${randomUUID()}.${tipo}`;
  const conteudo=new Uint8Array(await arquivo.arrayBuffer());
  if(tipo==='pdf' && new TextDecoder('latin1').decode(conteudo.slice(0,5))!=='%PDF-')throw new Error('Arquivo PDF inválido.');
  const {error:erro}=await banco.storage.from(BUCKET).upload(caminho,conteudo,{contentType:tipo==='xml'?'application/xml':'application/pdf',upsert:false});
  conferirErro(erro,'Armazenar arquivo privado');
  return caminho;
}

export async function importarXmlFiscal(dados:FormData){
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  const {banco,escritorioId,usuario,cliente}=await exigirCliente(clienteId);
  const direcao=seguro(dados.get('direcao'));
  if(!['ENTRADA','SAIDA'].includes(direcao))throw new Error('Selecione entrada ou saída.');
  const arquivo=exigirArquivo(dados,'arquivo','xml');
  const buffer=Buffer.from(await arquivo.arrayBuffer());
  const conteudo=new TextDecoder('utf-8',{fatal:true}).decode(buffer);
  const documento=interpretarDocumentoFiscal(conteudo,seguro(dados.get('tipo_generico')));
  const hash=createHash('sha256').update(buffer).digest('hex');
  const {data:existente,error:erroConsulta}=await banco.from('documentos_fiscais').select('id')
    .eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('hash_sha256',hash).maybeSingle();
  conferirErro(erroConsulta,'Conferir duplicidade');
  if(existente)throw new Error('Este XML já foi importado para o cliente selecionado.');
  if(documento.chave_acesso){
    const {data:jaExiste,error:erroChave}=await banco.from('documentos_fiscais').select('id').eq('escritorio_id',escritorioId)
      .eq('cliente_id',clienteId).eq('chave_acesso',documento.chave_acesso).maybeSingle();
    conferirErro(erroChave,'Conferir chave fiscal');
    if(jaExiste)throw new Error('Um documento com a mesma chave de acesso já está cadastrado.');
  }
  const identificacao=digitos(cliente.cpf_cnpj);
  const emitente=digitos(documento.cpf_cnpj_emitente||'');const destinatario=digitos(documento.cpf_cnpj_destinatario||'');
  if(emitente&&destinatario&&emitente!==identificacao&&destinatario!==identificacao)
    throw new Error('O CPF/CNPJ do cliente não consta como emitente nem destinatário do documento.');
  // Nem toda NFS-e informa o tomador no mesmo nível. Guardar ressalvas, sem homologar autenticidade.
  const caminho=await armazenarArquivo(banco,`${escritorioId}/${clienteId}/fiscal/documentos`,arquivo,'xml');
  const metadados={...documento.metadados_originais,arquivo_original:arquivo.name.slice(0,180),
    vinculo_emitente:emitente===identificacao,vinculo_destinatario:destinatario===identificacao,
    direcao_informada:direcao,validacao:documento.validacao,verificado_na_sefaz:false};
  const {error:erro}=await banco.from('documentos_fiscais').insert({
    escritorio_id:escritorioId,cliente_id:clienteId,tipo_documento:documento.tipo_documento,direcao,
    chave_acesso:documento.chave_acesso,numero_documento:documento.numero_documento,data_emissao:documento.data_emissao,
    cpf_cnpj_emitente:documento.cpf_cnpj_emitente,cpf_cnpj_destinatario:documento.cpf_cnpj_destinatario,
    valor_total:documento.valor_total,caminho_arquivo:caminho,hash_sha256:hash,
    validacao_xml:documento.validacao,metadados_originais:metadados,criado_por:usuario.id
  });
  if(erro){await banco.storage.from(BUCKET).remove([caminho]);conferirErro(erro,'Registrar documento fiscal');}
  revalidatePath('/fiscal/documentos');
  return {sucesso:true,mensagem:'XML importado. Confira os dados e a autenticidade do documento.'};
}

/** Integração assistida. A emissão e a quitação são comprovadas por arquivos oficiais anexados. */
export async function registrarDasMei(dados:FormData){
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  const {banco,escritorioId,cliente}=await exigirCliente(clienteId,true);
  const competencia=textoObrigatorio(dados.get('competencia'),'Competência');
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia))throw new Error('Competência inválida.');
  const situacao=seguro(dados.get('situacao'));
  if(!['PENDENTE','EMITIDO_EXTERNAMENTE','PAGO','VENCIDO','NAO_APLICAVEL'].includes(situacao))throw new Error('Situação inválida.');
  const vencimento=seguro(dados.get('data_vencimento'))||null;
  const pagamento=seguro(dados.get('data_pagamento'))||null;
  if(vencimento&&!/^\d{4}-\d{2}-\d{2}$/.test(vencimento))throw new Error('Vencimento inválido.');
  if(pagamento&&!/^\d{4}-\d{2}-\d{2}$/.test(pagamento))throw new Error('Data de pagamento inválida.');
  if(situacao==='PAGO'&&!pagamento)throw new Error('Informe a data do pagamento confirmado.');
  const valor=seguro(dados.get('valor'))?valorMonetarioBr(seguro(dados.get('valor'))):null;
  if(situacao!=='PENDENTE'&&situacao!=='NAO_APLICAVEL'&&valor===null)throw new Error('Informe o valor confirmado no PGMEI.');
  const {data:guiaAnterior,error:erroAnterior}=await banco.from('competencias_das_mei').select('situacao')
    .eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('competencia',`${competencia}-01`).maybeSingle();
  conferirErro(erroAnterior,'Conferir situação do DAS');
  if(guiaAnterior?.situacao==='PAGO'&&situacao!=='PAGO')
    throw new Error('O DAS consta como pago. Revise o registro antes de alterar sua situação; uma reversão requer trilha de auditoria própria.');
  if(valor!==null&&valor<0)throw new Error('Valor oficial do DAS inválido.');
  const anexo=dados.get('guia');
  const arquivo=anexo instanceof File&&anexo.size?exigirArquivo(dados,'guia','pdf'):null;
  if(situacao==='EMITIDO_EXTERNAMENTE'&&!arquivo){
    const {data:anterior}=await banco.from('competencias_das_mei').select('caminho_guia').eq('escritorio_id',escritorioId).eq('cliente_id',cliente.id).eq('competencia',`${competencia}-01`).maybeSingle();
    if(!anterior?.caminho_guia)throw new Error('Anexe o PDF oficial do DAS emitido no PGMEI.');
  }
  const pasta=`${escritorioId}/${clienteId}/fiscal/das`;
  const caminho=arquivo?await armazenarArquivo(banco,pasta,arquivo,'pdf'):null;
  const registro={escritorio_id:escritorioId,cliente_id:clienteId,competencia:`${competencia}-01`,situacao,
    valor,data_vencimento:vencimento,data_pagamento:situacao==='PAGO'?pagamento:null,
    referencia_externa:seguro(dados.get('referencia_externa'))||null,
    ...(caminho?{caminho_guia:caminho}:{})};
  const {error:erro}=await banco.from('competencias_das_mei').upsert(registro,{onConflict:'escritorio_id,cliente_id,competencia'});
  if(erro&&caminho)await banco.storage.from(BUCKET).remove([caminho]);
  conferirErro(erro,'Registrar DAS MEI');
  revalidatePath('/fiscal/das-mei');
  return {sucesso:true,mensagem:'Situação do DAS registrada com sucesso.'};
}

export async function salvarDeclaracaoMei(dados:FormData){
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  const {banco,escritorioId}=await exigirCliente(clienteId,true);
  const ano=Number(seguro(dados.get('ano_calendario')));
  if(!Number.isInteger(ano)||ano<2010||ano>2200)throw new Error('Ano-calendário inválido.');
  const situacao=seguro(dados.get('situacao'));
  if(!['EM_PREPARACAO','CONFERIDA','DECLARADA_EXTERNAMENTE'].includes(situacao))throw new Error('Situação inválida.');
  const comercio=valorMonetarioBr(seguro(dados.get('receita_comercio')));
  const servicos=valorMonetarioBr(seguro(dados.get('receita_servicos')));
  if(comercio<0||servicos<0)throw new Error('A receita anual não pode ser negativa. Confira os valores.');
  const transmitidaEm=seguro(dados.get('data_declaracao'))||null;
  if(situacao==='DECLARADA_EXTERNAMENTE'&&!transmitidaEm)throw new Error('Informe a data de transmissão oficial.');
  const {data:declaracaoAnterior,error:erroAnterior}=await banco.from('declaracoes_anuais_mei')
    .select('situacao,receita_comercio,receita_servicos,teve_empregado_no_ano,data_declaracao')
    .eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('ano_calendario',ano).maybeSingle();
  conferirErro(erroAnterior,'Conferir declaração existente');
  if(declaracaoAnterior?.situacao==='DECLARADA_EXTERNAMENTE'){
    const foiAlterada=situacao!=='DECLARADA_EXTERNAMENTE'||comercio!==Number(declaracaoAnterior.receita_comercio)||
      servicos!==Number(declaracaoAnterior.receita_servicos)||
      (seguro(dados.get('teve_empregado_no_ano'))==='SIM')!==Boolean(declaracaoAnterior.teve_empregado_no_ano)||
      transmitidaEm!==declaracaoAnterior.data_declaracao;
    if(foiAlterada)throw new Error('Declaração já transmitida. Uma retificação exige processo específico e não substitui automaticamente a declaração anterior.');
  }
  const arquivo=dados.get('recibo') instanceof File&&(dados.get('recibo') as File).size?exigirArquivo(dados,'recibo','pdf'):null;
  if(situacao==='DECLARADA_EXTERNAMENTE'&&!arquivo && declaracaoAnterior?.situacao!=='DECLARADA_EXTERNAMENTE')
    throw new Error('Para registrar a transmissão, anexe agora o recibo oficial de entrega da DASN-SIMEI.');
  const caminho=arquivo?await armazenarArquivo(banco,`${escritorioId}/${clienteId}/fiscal/dasn`,arquivo,'pdf'):null;
  const {error:erro}=await banco.from('declaracoes_anuais_mei').upsert({escritorio_id:escritorioId,cliente_id:clienteId,
    ano_calendario:ano,receita_comercio:comercio,receita_servicos:servicos,
    teve_empregado_no_ano:seguro(dados.get('teve_empregado_no_ano'))==='SIM',situacao,
    data_declaracao:situacao==='DECLARADA_EXTERNAMENTE'?transmitidaEm:null,
    ...(caminho?{caminho_recibo:caminho}:{}),
  },{onConflict:'escritorio_id,cliente_id,ano_calendario'});
  if(erro&&caminho)await banco.storage.from(BUCKET).remove([caminho]);
  conferirErro(erro,'Registrar DASN-SIMEI');
  revalidatePath('/fiscal/dasn-simei');
  return {sucesso:true,mensagem:'Informações da DASN-SIMEI registradas com sucesso.'};
}

export async function obterArquivoFiscal(tipo:'xml'|'das'|'dasn',id:string){
  const {banco,escritorioId}=await exigirEscritorio();validarUuid(id,'Documento');
  const tabela=tipo==='xml'?'documentos_fiscais':tipo==='das'?'competencias_das_mei':'declaracoes_anuais_mei';
  const coluna=tipo==='xml'?'caminho_arquivo':tipo==='das'?'caminho_guia':'caminho_recibo';
  const {data,error:erro}=await banco.from(tabela).select(`id,${coluna}`).eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
  conferirErro(erro,'Localizar arquivo fiscal');
  const caminho=data?.[coluna];if(typeof caminho!=='string'||!caminho)throw new Error('Arquivo não anexado a este registro.');
  // Links assinados temporários sem URLs públicas e sem exposição de chave de serviço.
  const {data:assinatura,error:erroLink}=await banco.storage.from(BUCKET).createSignedUrl(caminho,60);
  conferirErro(erroLink,'Obter arquivo');
  return assinatura!.signedUrl;
}
