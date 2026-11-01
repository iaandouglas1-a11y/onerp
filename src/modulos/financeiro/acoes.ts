'use server';
import { revalidatePath } from 'next/cache';
import { exigirEdicao } from '@/lib/seguranca/contexto';
import { conferirErro } from '@/lib/utilitarios/erros';
import { limparTexto, textoObrigatorio,valorMonetarioBr,mesValido,primeiroDiaMes } from '@/lib/utilitarios/formatacao';

function texto(dados:FormData,chave:string){return limparTexto(dados.get(chave),500);}
function moedaPositiva(dados:FormData,chave='valor'){const valor=valorMonetarioBr(texto(dados,chave));if(valor<=0)throw new Error('O valor deve ser maior que zero.');return valor;}
function data(dados:FormData,chave:string){const valor=textoObrigatorio(dados.get(chave),chave);if(!/^\d{4}-\d{2}-\d{2}$/.test(valor)||Number.isNaN(Date.parse(`${valor}T12:00:00Z`)))throw new Error('Data inválida.');return valor;}
function identificador(dados:FormData,chave:string){const valor=textoObrigatorio(dados.get(chave),chave);if(!/^[a-f0-9-]{36}$/i.test(valor))throw new Error('Identificador inválido.');return valor;}
function atualizar(){for(const rota of ['/inicio','/financeiro','/financeiro/honorarios','/financeiro/recebimentos','/financeiro/despesas','/financeiro/movimentacoes','/financeiro/contas','/financeiro/fluxo-de-caixa','/financeiro/relatorios'])revalidatePath(rota);}
function retorno(mensagem:string){atualizar();return {sucesso:true,mensagem};}
async function validarCliente(banco:Awaited<ReturnType<typeof exigirEdicao>>['banco'],escritorioId:string,id:string){
 if(!id)return null;
 const {data:registro,error}=await banco.from('clientes').select('id').eq('escritorio_id',escritorioId).eq('id',id).maybeSingle();
 conferirErro(error,'Consultar cliente');if(!registro)throw new Error('Cliente não pertence a este escritório.');return id;
}
async function validarConta(banco:Awaited<ReturnType<typeof exigirEdicao>>['banco'],escritorioId:string,id:string){
 const {data:registro,error}=await banco.from('contas_financeiras').select('id,ativo').eq('escritorio_id',escritorioId).eq('id',id).maybeSingle();
 conferirErro(error,'Consultar conta');if(!registro?.ativo)throw new Error('A conta financeira está inativa ou não pertence ao escritório.');return id;
}
async function validarCategoria(banco:Awaited<ReturnType<typeof exigirEdicao>>['banco'],escritorioId:string,id:string,tipo:'RECEITA'|'DESPESA'){
 if(!id)return null;const {data:registro,error}=await banco.from('categorias_financeiras').select('tipo').eq('escritorio_id',escritorioId).eq('id',id).maybeSingle();
 conferirErro(error,'Consultar categoria');if(registro?.tipo!==tipo)throw new Error('Categoria incompatível com o tipo informado.');return id;
}
export async function salvarCategoriaFinanceira(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const tipo=texto(dados,'tipo');if(!['RECEITA','DESPESA'].includes(tipo))throw new Error('Tipo de categoria inválido.');
 const registro={nome:textoObrigatorio(dados.get('nome'),'Nome'),tipo,ativo:dados.get('ativo')==='on'};const id=texto(dados,'id');
 const resultado=id?await banco.from('categorias_financeiras').update(registro).eq('id',id).eq('escritorio_id',escritorioId).select('id'):
 await banco.from('categorias_financeiras').insert({...registro,escritorio_id:escritorioId}).select('id');
 conferirErro(resultado.error,'Salvar categoria');if(!resultado.data?.length)throw new Error('Categoria não encontrada.');return retorno(id?'Categoria atualizada.':'Categoria cadastrada. Cadastre a próxima.');
}
export async function salvarContaFinanceira(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const tipo=texto(dados,'tipo');if(!['BANCO','CAIXA'].includes(tipo))throw new Error('Tipo de conta inválido.');
 const saldo=valorMonetarioBr(texto(dados,'saldo_inicial')||'0');
 const registro={nome:textoObrigatorio(dados.get('nome'),'Nome'),tipo,codigo_banco:texto(dados,'codigo_banco')||null,ativo:dados.get('ativo')==='on',saldo_inicial:saldo,data_saldo_inicial:texto(dados,'data_saldo_inicial')||null};
 const id=texto(dados,'id');const resultado=id?await banco.from('contas_financeiras').update(registro).eq('id',id).eq('escritorio_id',escritorioId).select('id'):
 await banco.from('contas_financeiras').insert({...registro,escritorio_id:escritorioId}).select('id');
 conferirErro(resultado.error,'Salvar conta');if(!resultado.data?.length)throw new Error('Conta não encontrada.');return retorno(id?'Conta atualizada.':'Conta cadastrada. Cadastre a próxima.');
}
export async function salvarHonorario(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const cliente_id=await validarCliente(banco,escritorioId,identificador(dados,'cliente_id'));
 const servico_id=texto(dados,'servico_id')||null;
 if(servico_id){const {data:servico}=await banco.from('servicos').select('id').eq('id',servico_id).eq('escritorio_id',escritorioId).maybeSingle();if(!servico)throw new Error('Serviço não cadastrado neste escritório.');}
 const dia_vencimento=Number(texto(dados,'dia_vencimento'));if(!Number.isInteger(dia_vencimento)||dia_vencimento<1||dia_vencimento>31)throw new Error('Dia de vencimento deve ficar entre 1 e 31.');
 const data_inicio=data(dados,'data_inicio'),data_fim=texto(dados,'data_fim')||null;
 if(data_fim&&data_fim<data_inicio)throw new Error('Data final anterior ao início.');
 const registro={cliente_id,servico_id,descricao:textoObrigatorio(dados.get('descricao'),'Descrição'),valor:moedaPositiva(dados),dia_vencimento,data_inicio,data_fim,ativo:dados.get('ativo')==='on'};
 const id=texto(dados,'id');const resultado=id?await banco.from('contratos_honorarios').update(registro).eq('id',id).eq('escritorio_id',escritorioId).select('id'):
 await banco.from('contratos_honorarios').insert({...registro,escritorio_id:escritorioId}).select('id');
 conferirErro(resultado.error,'Salvar honorário');if(!resultado.data?.length)throw new Error('Honorário não encontrado.');return retorno(id?'Honorário atualizado.':'Honorário cadastrado. Cadastre o próximo.');
}
export async function gerarCobrancasRecorrentes(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const competencia=mesValido(texto(dados,'competencia'));
 const {data:quantidade,error}=await banco.rpc('financeiro_gerar_cobrancas',{p_escritorio:escritorioId,p_competencia:primeiroDiaMes(competencia)});
 conferirErro(error,'Gerar cobranças');return retorno(`${quantidade??0} cobrança(s) criada(s). As competências já geradas não são duplicadas.`);
}
export async function salvarCobranca(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const cliente_id=await validarCliente(banco,escritorioId,identificador(dados,'cliente_id'));
 const competencia=texto(dados,'competencia');const id=texto(dados,'id');
 const registro={cliente_id,descricao:textoObrigatorio(dados.get('descricao'),'Descrição'),competencia:competencia?primeiroDiaMes(mesValido(competencia)):null,data_vencimento:data(dados,'data_vencimento'),valor:moedaPositiva(dados),tipo_cobranca:'AVULSO' as const};
 if(id){
  const {data:atual}=await banco.from('contas_receber').select('contrato_honorarios_id,situacao').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
  if(!atual||atual.contrato_honorarios_id)throw new Error('Apenas cobranças avulsas podem ser editadas. Edite o contrato para meses futuros.');
  if(atual.situacao!=='ABERTO')throw new Error('Cobrança recebida/cancelada: estorne os recebimentos antes de editar.');
 }
 const resultado=id?await banco.from('contas_receber').update(registro).eq('id',id).eq('escritorio_id',escritorioId).select('id'):
 await banco.from('contas_receber').insert({...registro,escritorio_id:escritorioId,situacao:'ABERTO'}).select('id');
 conferirErro(resultado.error,'Salvar cobrança');if(!resultado.data?.length)throw new Error('Cobrança não encontrada.');return retorno(id?'Cobrança atualizada.':'Cobrança cadastrada. Cadastre a próxima.');
}
export async function cancelarCobranca(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const id=identificador(dados,'id');
 const {data:recebidos,error:erroRec}=await banco.from('recebimentos').select('id').eq('escritorio_id',escritorioId).eq('conta_receber_id',id).limit(1);
 conferirErro(erroRec);if(recebidos?.length)throw new Error('Estorne os recebimentos antes de cancelar.');
 const {data,error}=await banco.from('contas_receber').update({situacao:'CANCELADO'}).eq('id',id).eq('escritorio_id',escritorioId).select('id');
 conferirErro(error,'Cancelar cobrança');if(!data?.length)throw new Error('Cobrança não encontrada.');return retorno('Cobrança cancelada.');
}
export async function excluirCobranca(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const id=identificador(dados,'id');
 const {data:recebidos}=await banco.from('recebimentos').select('id').eq('escritorio_id',escritorioId).eq('conta_receber_id',id).limit(1);
 if(recebidos?.length)throw new Error('Não é possível excluir cobrança com recebimentos.');
 const {data,error}=await banco.from('contas_receber').delete().eq('id',id).eq('escritorio_id',escritorioId).select('id');conferirErro(error);if(!data?.length)throw new Error('Cobrança não encontrada.');return retorno('Cobrança excluída.');
}
export async function registrarRecebimento(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const conta_id=identificador(dados,'conta_financeira_id');await validarConta(banco,escritorioId,conta_id);
 const {error}=await banco.rpc('financeiro_registrar_recebimento',{p_escritorio:escritorioId,p_receber:identificador(dados,'conta_receber_id'),p_conta:conta_id,p_data:data(dados,'data_pagamento'),p_valor:moedaPositiva(dados)});
 conferirErro(error,'Registrar recebimento');return retorno('Recebimento registrado com movimentação de caixa.');
}
export async function estornarRecebimento(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const {error}=await banco.rpc('financeiro_estornar_recebimento',{p_escritorio:escritorioId,p_recebimento:identificador(dados,'id')});
 conferirErro(error,'Estornar recebimento');return retorno('Recebimento estornado; saldo da cobrança atualizado.');
}
export async function salvarDespesa(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const categoria_id=await validarCategoria(banco,escritorioId,texto(dados,'categoria_id'),'DESPESA');
 const cliente_id=await validarCliente(banco,escritorioId,texto(dados,'cliente_id'));
 const competencia=texto(dados,'competencia');const id=texto(dados,'id');
 const registro={descricao:textoObrigatorio(dados.get('descricao'),'Descrição'),categoria_id,cliente_id,competencia:competencia?primeiroDiaMes(mesValido(competencia)):null,data_vencimento:data(dados,'data_vencimento'),valor:moedaPositiva(dados)};
 if(id){const {data:atual}=await banco.from('contas_pagar').select('situacao').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();if(atual?.situacao!=='ABERTO')throw new Error('Despesa com baixa ou cancelada: estorne antes de editar.');}
 const resultado=id?await banco.from('contas_pagar').update(registro).eq('id',id).eq('escritorio_id',escritorioId).select('id'):
 await banco.from('contas_pagar').insert({...registro,escritorio_id:escritorioId,situacao:'ABERTO'}).select('id');
 conferirErro(resultado.error,'Salvar despesa');if(!resultado.data?.length)throw new Error('Despesa não encontrada.');return retorno(id?'Despesa atualizada.':'Despesa cadastrada. Cadastre a próxima.');
}
export async function cancelarDespesa(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const id=identificador(dados,'id');const {data:pagos}=await banco.from('pagamentos_contas_pagar').select('id').eq('escritorio_id',escritorioId).eq('conta_pagar_id',id).limit(1);
 if(pagos?.length)throw new Error('Estorne os pagamentos antes de cancelar.');
 const {data,error}=await banco.from('contas_pagar').update({situacao:'CANCELADO'}).eq('id',id).eq('escritorio_id',escritorioId).select('id');conferirErro(error);if(!data?.length)throw new Error('Despesa não encontrada.');return retorno('Despesa cancelada.');
}
export async function excluirDespesa(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const id=identificador(dados,'id');const {data:pagos}=await banco.from('pagamentos_contas_pagar').select('id').eq('escritorio_id',escritorioId).eq('conta_pagar_id',id).limit(1);
 if(pagos?.length)throw new Error('Não é possível excluir despesa já paga.');
 const {data,error}=await banco.from('contas_pagar').delete().eq('id',id).eq('escritorio_id',escritorioId).select('id');conferirErro(error);if(!data?.length)throw new Error('Despesa não encontrada.');return retorno('Despesa excluída.');
}
export async function registrarPagamento(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const conta=identificador(dados,'conta_financeira_id');await validarConta(banco,escritorioId,conta);
 const {error}=await banco.rpc('financeiro_registrar_pagamento',{p_escritorio:escritorioId,p_pagar:identificador(dados,'conta_pagar_id'),p_conta:conta,p_data:data(dados,'data_pagamento'),p_valor:moedaPositiva(dados)});
 conferirErro(error,'Registrar pagamento');return retorno('Pagamento registrado e abatido do caixa.');
}
export async function estornarPagamento(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const {error}=await banco.rpc('financeiro_estornar_pagamento',{p_escritorio:escritorioId,p_pagamento:identificador(dados,'id')});
 conferirErro(error,'Estornar pagamento');return retorno('Pagamento estornado; saldo da despesa atualizado.');
}
export async function salvarMovimentoFinanceiro(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const tipo=texto(dados,'tipo');if(tipo!=='RECEITA'&&tipo!=='DESPESA')throw new Error('Use a transferência para movimentar entre contas.');
 const conta_financeira_id=identificador(dados,'conta_financeira_id');await validarConta(banco,escritorioId,conta_financeira_id);
 const categoria_id=await validarCategoria(banco,escritorioId,texto(dados,'categoria_id'),tipo);
 const cliente_id=await validarCliente(banco,escritorioId,texto(dados,'cliente_id'));
 const registro={tipo,conta_financeira_id,categoria_id,cliente_id,data_movimento:data(dados,'data_movimento'),valor:moedaPositiva(dados),descricao:textoObrigatorio(dados.get('descricao'),'Descrição'),origem_registro:'MANUAL'};
 const id=texto(dados,'id');if(id){const {data:original}=await banco.from('movimentacoes_financeiras').select('origem_registro').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();if(original?.origem_registro!=='MANUAL')throw new Error('Recebimentos, pagamentos e transferências são geridos pela rotina de origem.');}
 const resultado=id?await banco.from('movimentacoes_financeiras').update(registro).eq('id',id).eq('escritorio_id',escritorioId).select('id'):
 await banco.from('movimentacoes_financeiras').insert({...registro,escritorio_id:escritorioId}).select('id');
 conferirErro(resultado.error,'Salvar movimentação');if(!resultado.data?.length)throw new Error('Movimentação não encontrada.');return retorno(id?'Movimentação atualizada.':'Movimentação cadastrada. Cadastre a próxima.');
}
export async function excluirMovimentoFinanceiro(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const {data,error}=await banco.from('movimentacoes_financeiras').delete().eq('id',identificador(dados,'id')).eq('escritorio_id',escritorioId).eq('origem_registro','MANUAL').select('id');
 conferirErro(error,'Excluir movimentação');if(!data?.length)throw new Error('Somente movimentações manuais podem ser excluídas aqui.');return retorno('Movimentação excluída.');
}
export async function transferirEntreContas(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const origem=identificador(dados,'conta_origem_id'),destino=identificador(dados,'conta_destino_id');
 if(origem===destino)throw new Error('Escolha contas diferentes.');
 const {error}=await banco.rpc('financeiro_transferir',{p_escritorio:escritorioId,p_origem:origem,p_destino:destino,p_data:data(dados,'data_movimento'),p_valor:moedaPositiva(dados),p_descricao:texto(dados,'descricao')});
 conferirErro(error,'Transferir valores');return retorno('Transferência registrada nas duas contas.');
}
export async function excluirTransferencia(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();const {error}=await banco.rpc('financeiro_excluir_transferencia',{p_escritorio:escritorioId,p_grupo:identificador(dados,'grupo_transferencia')});
 conferirErro(error,'Excluir transferência');return retorno('Transferência excluída das duas contas.');
}
