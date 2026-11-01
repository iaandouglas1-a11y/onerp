'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { exigirEdicao, exigirEscritorio, exigirUsuario } from '@/lib/seguranca/contexto';
import { criarClienteAdministrador } from '@/lib/supabase/administrador';
import { descriptografarCredencial, criptografarCredencial } from '@/lib/seguranca/cofre';
import { limparTexto, normalizarData, textoObrigatorio, digitos } from '@/lib/utilitarios/formatacao';
import { conferirErro } from '@/lib/utilitarios/erros';
import { prepararAcessoGovBr, gravarAcessoGovBr } from '@/modulos/societario/acesso-govbr';

function ler(dados:FormData, nome:string, limite=300){return limparTexto(dados.get(nome),limite);}
function vazioOuTexto(dados:FormData,nome:string){return ler(dados,nome)||null;}
function destinoCliente(clienteId:string,aba='resumo'){return `/societario/clientes/${clienteId}?aba=${aba}`;}

export async function criarEscritorio(dados: FormData) {
  const {banco,usuario}=await exigirUsuario();
  const nome=textoObrigatorio(dados.get('nome'),'Nome do escritório');
  const {error:erro}=await banco.from('escritorios').insert({nome,razao_social:vazioOuTexto(dados,'razao_social'),cpf_cnpj:digitos(ler(dados,'cpf_cnpj')),criado_por:usuario.id});
  conferirErro(erro,'Criar escritório');
  redirect('/inicio');
}
function dadosCliente(dados:FormData) {
  const tipo_pessoa=ler(dados,'tipo_pessoa');
  const cpf_cnpj=digitos(textoObrigatorio(dados.get('cpf_cnpj'),'CPF/CNPJ'));
  if(!['PF','PJ'].includes(tipo_pessoa))throw new Error('Tipo de pessoa inválido.');
  if(cpf_cnpj.length !== (tipo_pessoa==='PF'?11:14))throw new Error('CPF/CNPJ deve ter 11 ou 14 dígitos conforme o tipo de pessoa.');
  const situacao=ler(dados,'situacao')||'ONBOARDING';
  const regime_tributario=ler(dados,'regime_tributario')||null;
  if(!['ONBOARDING','ATIVO','RISCO','INATIVO','CANCELADO'].includes(situacao))throw new Error('Situação inválida.');
  if(regime_tributario&&!['MEI','SIMPLES_NACIONAL','LUCRO_PRESUMIDO','LUCRO_REAL','ISENTO','OUTRO'].includes(regime_tributario))throw new Error('Regime tributário inválido.');
  return {tipo_pessoa:tipo_pessoa as 'PF'|'PJ',razao_social:textoObrigatorio(dados.get('razao_social'),'Nome/Razão social'),nome_fantasia:vazioOuTexto(dados,'nome_fantasia'),cpf_cnpj,
    inscricao_estadual:vazioOuTexto(dados,'inscricao_estadual'),inscricao_municipal:vazioOuTexto(dados,'inscricao_municipal'),
    data_abertura:normalizarData(dados.get('data_abertura')),regime_tributario,cnae_principal:vazioOuTexto(dados,'cnae_principal'),
    cnaes_secundarios:ler(dados,'cnaes_secundarios',800).split(',').map(item=>item.trim()).filter(Boolean),situacao,observacoes:vazioOuTexto(dados,'observacoes')};
}
export async function salvarCliente(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirEdicao();
  const valores=dadosCliente(dados);
  const identificador=ler(dados,'id');
  if(identificador){
    await validarCliente(banco,escritorioId,identificador);
    const acessoGov=await prepararAcessoGovBr(dados,escritorioId,identificador);
    const {error:erro}=await banco.from('clientes').update(valores).eq('id',identificador).eq('escritorio_id',escritorioId);
    conferirErro(erro,'Atualizar cliente');
    if(acessoGov){
      try { await gravarAcessoGovBr(acessoGov,escritorioId,identificador,usuario.id); }
      catch { throw new Error('Os dados cadastrais foram atualizados, mas a credencial gov.br não pôde ser salva no cofre. Abra novamente a edição para conferir o acesso.'); }
    }
    revalidatePath('/societario/clientes');revalidatePath(destinoCliente(identificador));
    return {sucesso:true,mensagem:'Dados do cliente atualizados.',id:identificador};
  }
  const acessoGov=await prepararAcessoGovBr(dados,escritorioId,null);
  const {data:registro,error:erro}=await banco.from('clientes').insert({...valores,escritorio_id:escritorioId}).select('id').single();
  conferirErro(erro,'Cadastrar cliente');
  if(acessoGov){
    try { await gravarAcessoGovBr(acessoGov,escritorioId,registro!.id,usuario.id); }
    catch {
      // O cliente foi criado. Não o excluir automaticamente: o cofre pode ter sido salvo
      // antes de uma falha de auditoria. Informar o estado evita cadastros duplicados.
      revalidatePath('/societario/clientes');
      return {sucesso:false,mensagem:'O cliente foi cadastrado, mas não foi possível confirmar o acesso gov.br. Não tente cadastrar novamente: localize o cliente na lista e confira a aba Acessos.',id:registro!.id};
    }
  }
  revalidatePath('/societario/clientes');
  return {sucesso:true,mensagem:'Cliente cadastrado. Você pode incluir outro.',id:registro!.id};
}
async function validarCliente(banco:Awaited<ReturnType<typeof exigirEdicao>>['banco'],escritorioId:string,clienteId:string) {
  const {data:cliente,error:erro}=await banco.from('clientes').select('id').eq('escritorio_id',escritorioId).eq('id',clienteId).maybeSingle();
  if(erro||!cliente)throw new Error('Cliente não encontrado neste escritório.');
}
/** Somente tabelas e campos declarados nesta função podem ser alterados pelo formulário. */
export async function salvarRegistroSocietario(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirEdicao();
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  await validarCliente(banco,escritorioId,clienteId);
  const tipo=ler(dados,'tipo'); const registroId=ler(dados,'registro_id');
  let tabela:string;let valores:Record<string,unknown>;let aba:string;
  switch(tipo){
    case 'endereco':tabela='enderecos_clientes';aba='enderecos';valores={identificacao:ler(dados,'identificacao')||'Principal',cep:digitos(ler(dados,'cep')),logradouro:ler(dados,'logradouro'),numero:ler(dados,'numero'),complemento:vazioOuTexto(dados,'complemento'),bairro:ler(dados,'bairro'),cidade:ler(dados,'cidade'),uf:ler(dados,'uf').toUpperCase().slice(0,2),principal:dados.get('principal')==='on'};break;
    case 'contato':tabela='contatos_clientes';aba='contatos';valores={nome:textoObrigatorio(dados.get('nome'),'Nome'),posicao:vazioOuTexto(dados,'posicao'),email:vazioOuTexto(dados,'email'),telefone:vazioOuTexto(dados,'telefone'),whatsapp:vazioOuTexto(dados,'whatsapp'),principal:dados.get('principal')==='on',observacoes:vazioOuTexto(dados,'observacoes')};break;
    case 'representante':tabela='representantes_clientes';aba='representantes';valores={nome:textoObrigatorio(dados.get('nome'),'Nome'),cpf_cnpj:digitos(ler(dados,'cpf_cnpj')),vinculo:vazioOuTexto(dados,'vinculo'),data_inicio:normalizarData(dados.get('data_inicio')),data_fim:normalizarData(dados.get('data_fim')),observacoes:vazioOuTexto(dados,'observacoes')};break;
    case 'servico_cliente':tabela='servicos_clientes';aba='servicos';valores={servico_id:textoObrigatorio(dados.get('servico_id'),'Serviço'),data_inicio:normalizarData(dados.get('data_inicio')),data_fim:normalizarData(dados.get('data_fim')),situacao:ler(dados,'situacao')||'ATIVO'};if(!['ATIVO','SUSPENSO','ENCERRADO'].includes(String(valores.situacao)))throw new Error('Situação inválida.');break;
    case 'observacao':tabela='observacoes_clientes';aba='observacoes';valores={observacao:textoObrigatorio(dados.get('observacao'),'Observação',4000),criado_por:usuario.id};break;
    case 'implantacao':tabela='itens_implantacao_clientes';aba='implantacao';valores={descricao:textoObrigatorio(dados.get('descricao'),'Etapa'),posicao:Number(ler(dados,'posicao')||'0')};break;
    case 'obrigacao':tabela='obrigacoes_clientes';aba='obrigacoes';valores={titulo:textoObrigatorio(dados.get('titulo'),'Obrigação'),data_vencimento:textoObrigatorio(dados.get('data_vencimento'),'Vencimento'),inicio_periodo:normalizarData(dados.get('inicio_periodo')),fim_periodo:normalizarData(dados.get('fim_periodo')),situacao:ler(dados,'situacao')||'PENDENTE'};if(!['PENDENTE','EM_ANDAMENTO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].includes(String(valores.situacao)))throw new Error('Situação inválida.');break;
    case 'tarefa':tabela='tarefas';aba='tarefas';valores={titulo:textoObrigatorio(dados.get('titulo'),'Tarefa'),descricao:vazioOuTexto(dados,'descricao'),data_vencimento:normalizarData(dados.get('data_vencimento')),prioridade:ler(dados,'prioridade')||'NORMAL',situacao:ler(dados,'situacao')||'A_FAZER'};if(!['BAIXA','NORMAL','ALTA'].includes(String(valores.prioridade)))throw new Error('Prioridade inválida.');if(!['A_FAZER','EM_EXECUCAO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].includes(String(valores.situacao)))throw new Error('Situação inválida.');break;
    default:throw new Error('Operação não permitida.');
  }
  if(tipo==='servico_cliente'){
    const {data:servico}=await banco.from('servicos').select('id').eq('id',valores.servico_id as string).eq('escritorio_id',escritorioId).maybeSingle();
    if(!servico)throw new Error('O serviço pertence a outro escritório ou não existe.');
  }
  if(registroId && !['observacao'].includes(tipo)){
    const {data:atual,error:falha}=await banco.from(tabela).select('id').eq('id',registroId).eq('cliente_id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
    if(falha||!atual)throw new Error('Registro não encontrado neste cliente.');
    const {error:erro}=await banco.from(tabela).update(valores).eq('id',registroId).eq('cliente_id',clienteId).eq('escritorio_id',escritorioId);
    conferirErro(erro,'Atualizar registro');
  }else{
    const {error:erro}=await banco.from(tabela).insert({...valores,escritorio_id:escritorioId,cliente_id:clienteId});
    conferirErro(erro,'Criar registro');
  }
  revalidatePath(`/societario/clientes/${clienteId}`);revalidatePath('/societario/tarefas');revalidatePath('/societario/obrigacoes');return {sucesso:true,mensagem:registroId?'Registro atualizado.':'Registro cadastrado. Você pode incluir outro.'};
}
export async function atualizarSituacaoTarefa(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const id=textoObrigatorio(dados.get('id'),'Tarefa');const situacao=ler(dados,'situacao');
  if(!['A_FAZER','EM_EXECUCAO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].includes(situacao))throw new Error('Situação inválida.');
  const {error:erro}=await banco.from('tarefas').update({situacao,concluido_em:situacao==='CONCLUIDA'?new Date().toISOString():null}).eq('id',id).eq('escritorio_id',escritorioId);
  conferirErro(erro);revalidatePath('/societario/tarefas');return {sucesso:true,mensagem:'Situação atualizada.'};
}
/**
 * Adaptador para o atributo `action` de formulários HTML.
 * O React/Next.js aceita somente Promise<void> nesse contexto.
 * A versão que devolve mensagem permanece disponível ao FormularioContinuo.
 */
export async function atualizarSituacaoTarefaFormulario(dados: FormData): Promise<void> {
  await atualizarSituacaoTarefa(dados);
}

export async function atualizarSituacaoObrigacao(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const id=textoObrigatorio(dados.get('id'),'Obrigação');const situacao=ler(dados,'situacao');
  if(!['PENDENTE','EM_ANDAMENTO','AGUARDANDO_CLIENTE','CONCLUIDA','CANCELADA'].includes(situacao))throw new Error('Situação inválida.');
  const {error:erro}=await banco.from('obrigacoes_clientes').update({situacao,concluido_em:situacao==='CONCLUIDA'?new Date().toISOString():null}).eq('id',id).eq('escritorio_id',escritorioId);
  conferirErro(erro);revalidatePath('/societario/obrigacoes');
}
export async function alternarItem(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const id=textoObrigatorio(dados.get('id'),'Etapa');const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');
  await validarCliente(banco,escritorioId,clienteId);
  const concluido=ler(dados,'concluido')==='true';
  const {error:erro}=await banco.from('itens_implantacao_clientes').update({concluido,concluido_em:concluido?new Date().toISOString():null}).eq('id',id).eq('cliente_id',clienteId).eq('escritorio_id',escritorioId);
  conferirErro(erro);revalidatePath(destinoCliente(clienteId));
}
export async function criarServico(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();
  const {error:erro}=await banco.from('servicos').insert({escritorio_id:escritorioId,codigo:textoObrigatorio(dados.get('codigo'),'Código').toUpperCase(),nome:textoObrigatorio(dados.get('nome'),'Nome'),descricao:vazioOuTexto(dados,'descricao')});
  conferirErro(erro);revalidatePath('/societario/servicos');return {sucesso:true,mensagem:'Serviço cadastrado. Você pode incluir outro.'};
}
export async function criarModeloObrigacao(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const recorrencia=ler(dados,'recorrencia');
  if(!['MONTHLY','QUARTERLY','YEARLY','ONCE'].includes(recorrencia))throw new Error('Recorrência inválida.');
  const dia=Number(ler(dados,'dia_vencimento')||0);
  const {error:erro}=await banco.from('modelos_obrigacoes').insert({escritorio_id:escritorioId,nome:textoObrigatorio(dados.get('nome'),'Nome'),modulo:ler(dados,'modulo')||'SOCIETARIO',recorrencia,dia_vencimento:dia||null,descricao:vazioOuTexto(dados,'descricao')});
  conferirErro(erro);revalidatePath('/societario/obrigacoes');return {sucesso:true,mensagem:'Modelo cadastrado. Você pode incluir outro.'};
}
export async function enviarDocumento(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirEdicao();
  const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');await validarCliente(banco,escritorioId,clienteId);
  const arquivo=dados.get('arquivo');if(!(arquivo instanceof File)||arquivo.size===0)throw new Error('Selecione um arquivo.');
  if(arquivo.size>10*1024*1024)throw new Error('Limite de 10 MB por documento.');
  const tipos=['application/pdf','image/jpeg','image/png','text/xml','application/xml','text/plain'];
  if(!tipos.includes(arquivo.type))throw new Error('Tipo de arquivo não autorizado.');
  const nome=arquivo.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-100);
  const caminho=`${escritorioId}/${clienteId}/${crypto.randomUUID()}-${nome}`;
  const {error:erroArquivo}=await banco.storage.from('on-erp-private').upload(caminho,arquivo,{contentType:arquivo.type,upsert:false});
  conferirErro(erroArquivo,'Enviar arquivo');
  const {error:erroRegistro}=await banco.from('documentos').insert({escritorio_id:escritorioId,cliente_id:clienteId,categoria:ler(dados,'categoria')||'GERAL',titulo:ler(dados,'titulo')||nome,
    repositorio_arquivos:'on-erp-private',caminho_arquivo:caminho,tipo_midia:arquivo.type,tamanho_arquivo_bytes:arquivo.size,data_validade:normalizarData(dados.get('data_validade')),enviado_por:usuario.id});
  if(erroRegistro){await banco.storage.from('on-erp-private').remove([caminho]);conferirErro(erroRegistro,'Registrar documento');}
  revalidatePath(destinoCliente(clienteId));return {sucesso:true,mensagem:'Documento enviado. Você pode enviar outro.'};
}
export async function obterLinkDocumento(id:string) {
  const {banco,escritorioId}=await exigirEscritorio();
  const {data:documento,error:erro}=await banco.from('documentos').select('caminho_arquivo,repositorio_arquivos').eq('id',id).eq('escritorio_id',escritorioId).single();
  conferirErro(erro);if(documento?.repositorio_arquivos!=='on-erp-private')throw new Error('Repositório indisponível.');
  const {data,error:erroUrl}=await banco.storage.from('on-erp-private').createSignedUrl(documento.caminho_arquivo,60);
  conferirErro(erroUrl);return data?.signedUrl??null;
}
export async function listarCredenciaisSeguras(clienteId:string) {
  const {escritorioId,banco}=await exigirEdicao();await validarCliente(banco,escritorioId,clienteId);
  const administrador=criarClienteAdministrador();
  const {data,error:erro}=await administrador.from('credenciais_clientes').select('id,nome_portal,identificacao_usuario,data_validade,atualizado_em').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).order('nome_portal');
  conferirErro(erro,'Listar acessos');return data??[];
}
export async function criarCredencial(dados:FormData) {
  const {escritorioId,usuario,banco}=await exigirEdicao();const clienteId=textoObrigatorio(dados.get('cliente_id'),'Cliente');await validarCliente(banco,escritorioId,clienteId);
  const nome_portal=textoObrigatorio(dados.get('nome_portal'),'Nome do portal');
  const segredo=textoObrigatorio(dados.get('segredo'),'Senha/segredo',4000);
  const conteudo_criptografado=criptografarCredencial(segredo);
  const administrador=criarClienteAdministrador();
  const {data:registro,error:erro}=await administrador.from('credenciais_clientes').insert({escritorio_id:escritorioId,cliente_id:clienteId,nome_portal,identificacao_usuario:vazioOuTexto(dados,'identificacao_usuario'),conteudo_criptografado,criado_por:usuario.id,data_validade:normalizarData(dados.get('data_validade'))}).select('id').single();
  conferirErro(erro,'Salvar credencial');
  const {error:erroLog}=await administrador.from('historico_acessos_credenciais').insert({escritorio_id:escritorioId,credencial_id:registro!.id,usuario_id:usuario.id,acao:'CREATE'});
  conferirErro(erroLog,'Registrar auditoria do cofre');
  revalidatePath(destinoCliente(clienteId));return {sucesso:true,mensagem:'Credencial salva. Você pode cadastrar outra.'};
}
export async function revelarCredencial(id:string,clienteId:string) {
  const {escritorioId,usuario,banco}=await exigirEdicao();await validarCliente(banco,escritorioId,clienteId);
  const administrador=criarClienteAdministrador();
  const {data:registro,error:erro}=await administrador.from('credenciais_clientes').select('conteudo_criptografado').eq('id',id).eq('cliente_id',clienteId).eq('escritorio_id',escritorioId).single();
  conferirErro(erro,'Localizar credencial');
  const segredo=descriptografarCredencial(registro!.conteudo_criptografado);
  const {error:erroLog}=await administrador.from('historico_acessos_credenciais').insert({escritorio_id:escritorioId,credencial_id:id,usuario_id:usuario.id,acao:'REVEAL'});
  conferirErro(erroLog,'Auditar visualização');return segredo;
}
export async function adicionarItemTarefa(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const tarefaId=textoObrigatorio(dados.get('tarefa_id'),'Tarefa');
  const {data:tarefa}=await banco.from('tarefas').select('id').eq('id',tarefaId).eq('escritorio_id',escritorioId).maybeSingle();if(!tarefa)throw new Error('Tarefa inválida.');
  const {error:erro}=await banco.from('itens_checklist_tarefas').insert({escritorio_id:escritorioId,tarefa_id:tarefaId,descricao:textoObrigatorio(dados.get('descricao'),'Item'),posicao:0});
  conferirErro(erro);revalidatePath(`/societario/tarefas/${tarefaId}`);return {sucesso:true,mensagem:'Item do checklist incluído.'};
}
export async function alternarItemTarefa(dados:FormData) {
  const {banco,escritorioId}=await exigirEdicao();const id=textoObrigatorio(dados.get('id'),'Item');const tarefaId=textoObrigatorio(dados.get('tarefa_id'),'Tarefa');
  const {data:tarefa}=await banco.from('tarefas').select('id').eq('id',tarefaId).eq('escritorio_id',escritorioId).maybeSingle();if(!tarefa)throw new Error('Tarefa não encontrada.');
  const concluido=ler(dados,'concluido')==='true';
  const {error:erro}=await banco.from('itens_checklist_tarefas').update({concluido,concluido_em:concluido?new Date().toISOString():null}).eq('id',id).eq('tarefa_id',tarefaId).eq('escritorio_id',escritorioId);
  conferirErro(erro);revalidatePath(`/societario/tarefas/${tarefaId}`);
}
export async function comentarTarefa(dados:FormData) {
  const {banco,escritorioId,usuario}=await exigirEdicao();const tarefaId=textoObrigatorio(dados.get('tarefa_id'),'Tarefa');
  const {data:tarefa}=await banco.from('tarefas').select('id').eq('id',tarefaId).eq('escritorio_id',escritorioId).maybeSingle();if(!tarefa)throw new Error('Tarefa não encontrada.');
  const {error:erro}=await banco.from('comentarios_tarefas').insert({escritorio_id:escritorioId,tarefa_id:tarefaId,comentario:textoObrigatorio(dados.get('comentario'),'Comentário',4000),autor_id:usuario.id});
  conferirErro(erro);revalidatePath(`/societario/tarefas/${tarefaId}`);return {sucesso:true,mensagem:'Comentário registrado.'};
}

/** Inativar mantém lançamentos, histórico e documentos vinculados ao cliente. */
export async function alterarSituacaoCliente(dados:FormData){
  const {banco,escritorioId}=await exigirEdicao();
  const id=textoObrigatorio(dados.get('id'),'Cliente');
  const situacao=ler(dados,'situacao');
  if(!['INATIVO','ATIVO'].includes(situacao))throw new Error('Situação inválida.');
  const {data,error:erro}=await banco.from('clientes').update({situacao}).eq('id',id).eq('escritorio_id',escritorioId).select('id');
  conferirErro(erro,'Atualizar situação do cliente');
  if(!data?.length)throw new Error('Cliente não encontrado ou sem permissão para alteração.');
  revalidatePath('/societario/clientes');revalidatePath(`/societario/clientes/${id}`);revalidatePath('/inicio');
}

/** Evita apagar dados históricos por cascata: exclusão permitida apenas sem vínculos. */
export async function excluirCliente(dados:FormData){
  const {banco,escritorioId}=await exigirEdicao();
  const id=textoObrigatorio(dados.get('id'),'Cliente');
  await validarCliente(banco,escritorioId,id);
  const tabelasVinculadas=[
    'enderecos_clientes','contatos_clientes','representantes_clientes','servicos_clientes',
    'observacoes_clientes','documentos','obrigacoes_clientes',
    'tarefas','itens_implantacao_clientes','movimentacoes_fiscais','documentos_fiscais',
    'ajustes_faturamento_mei','competencias_das_mei','declaracoes_anuais_mei',
    'planos_contas','periodos_contabeis','lancamentos_contabeis','contas_bancarias',
    'empregados','processamentos_folha','contratos_honorarios','contas_receber',
    'movimentacoes_financeiras','importacoes'
  ];
  // O cofre possui acesso revogado para clientes autenticados; uma FK RESTRICT
  // impede a exclusão se houver credenciais, sem revelar informações sensíveis.
  for(const tabela of tabelasVinculadas){
    const {count,error:erro}=await banco.from(tabela).select('id',{count:'exact',head:true}).eq('escritorio_id',escritorioId).eq('cliente_id',id);
    conferirErro(erro,`Verificar vínculos em ${tabela}`);
    if((count??0)>0)throw new Error('O cliente possui informações vinculadas e não pode ser excluído. Utilize Inativar para preservar os registros históricos.');
  }
  const {data,error:erro}=await banco.from('clientes').delete().eq('id',id).eq('escritorio_id',escritorioId).select('id');
  conferirErro(erro,'Excluir cliente');
  if(!data?.length)throw new Error('Não foi possível excluir o cliente. Verifique as permissões.');
  revalidatePath('/societario/clientes');revalidatePath('/inicio');
  redirect('/societario/clientes');
}
