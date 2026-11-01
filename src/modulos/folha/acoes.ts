'use server';
import { revalidatePath } from 'next/cache';
import { exigirEdicao } from '@/lib/seguranca/contexto';
import { digitos, limparTexto, textoObrigatorio, valorMonetarioBr } from '@/lib/utilitarios/formatacao';
import { conferirErro } from '@/lib/utilitarios/erros';
import { calcularContracheque, type EventoCalculado, type ParametrosFolha } from './calculos';
import { calcularEventoVariavel, referenciaDoEvento } from './calculo-eventos-variaveis';

function ler(dados:FormData,campo:string){return limparTexto(dados.get(campo));}
function uuid(valor:string){if(!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(valor))throw new Error('Identificador inválido.');return valor;}
function validarCompetencia(valor:string){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor))throw new Error('Competência inválida.');return valor+'-01';}
function cpfValido(valor:string){
 const cpf=digitos(valor);if(!/^\d{11}$/.test(cpf)||/^(\d)\1{10}$/.test(cpf))return false;
 for(let pos=9;pos<11;pos++){let soma=0;for(let i=0;i<pos;i++)soma+=Number(cpf[i])*(pos+1-i);
 const digito=(soma*10)%11%10;if(digito!==Number(cpf[pos]))return false;}return true;
}
export async function salvarEmpregado(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();
 const clienteId=uuid(textoObrigatorio(dados.get('cliente_id'),'Cliente'));
 const id=ler(dados,'id');if(id)uuid(id);
 const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id').eq('id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
 conferirErro(erroCliente,'Consultar cliente');if(!cliente)throw new Error('Cliente não pertence ao escritório.');
 const cpf=digitos(ler(dados,'cpf'));if(!cpfValido(cpf))throw new Error('CPF inválido.');
 const salario=valorMonetarioBr(ler(dados,'salario'));if(salario<=0)throw new Error('Salário deve ser maior que zero.');
 const divisorHoras=Number(ler(dados,'divisor_horas_mensais'));
 if(!Number.isFinite(divisorHoras)||divisorHoras<1||divisorHoras>400)throw new Error('Informe o divisor contratual de horas mensais (ex.: 220).');
 const admissao=textoObrigatorio(dados.get('data_admissao'),'Admissão');
 const desligamento=ler(dados,'data_desligamento')||null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(admissao)||desligamento&&!/^\d{4}-\d{2}-\d{2}$/.test(desligamento)||desligamento&&desligamento<admissao)throw new Error('Datas contratuais inválidas.');
 const situacao=ler(dados,'situacao')||'ATIVO';
 if(!['ATIVO','AFASTADO','DESLIGADO'].includes(situacao))throw new Error('Situação não permitida.');
 if(situacao==='DESLIGADO'&&!desligamento)throw new Error('Informe a data de desligamento.');
 if(situacao!=='DESLIGADO'&&desligamento)throw new Error('Remova a data de desligamento ou altere a situação para desligado.');
 const dependentes=Number(ler(dados,'dependentes_irrf')||'0');if(!Number.isInteger(dependentes)||dependentes<0||dependentes>99)throw new Error('Dependentes inválidos.');
 const nascimento=ler(dados,'data_nascimento')||null;
 const registro={nome_completo:textoObrigatorio(dados.get('nome_completo'),'Nome'),cpf,cliente_id:clienteId,
  codigo_funcionario:ler(dados,'codigo_funcionario')||null,cargo:ler(dados,'cargo')||null,cbo:ler(dados,'cbo')||null,
  salario,divisor_horas_mensais:divisorHoras,data_admissao:admissao,data_desligamento:desligamento,jornada_trabalho:ler(dados,'jornada_trabalho')||null,
  situacao,data_nascimento:nascimento,dependentes_irrf:dependentes,observacoes:ler(dados,'observacoes')||null};
 if(id){
  const {data:anterior,error:erroAnterior}=await banco.from('empregados').select('*').eq('escritorio_id',escritorioId).eq('id',id).eq('cliente_id',clienteId).maybeSingle();
  conferirErro(erroAnterior);if(!anterior)throw new Error('Empregado não localizado neste cliente.');
  const {error:erro}=await banco.from('empregados').update(registro).eq('id',id).eq('cliente_id',clienteId).eq('escritorio_id',escritorioId);
  conferirErro(erro,'Atualizar empregado');
  const historicoAnterior={cargo:anterior.cargo,salario:anterior.salario,jornada_trabalho:anterior.jornada_trabalho,situacao:anterior.situacao,data_admissao:anterior.data_admissao,data_desligamento:anterior.data_desligamento};
  const historicoNovo={cargo:registro.cargo,salario:registro.salario,jornada_trabalho:registro.jornada_trabalho,situacao:registro.situacao,data_admissao:registro.data_admissao,data_desligamento:registro.data_desligamento};
  const {error:erroHistorico}=await banco.from('alteracoes_contratuais_empregados').insert({escritorio_id:escritorioId,empregado_id:id,data_vigencia:new Date().toISOString().slice(0,10),valores_anteriores:historicoAnterior,valores_novos:historicoNovo,justificativa:'Atualização de cadastro no ERP'});
  conferirErro(erroHistorico,'Registrar histórico contratual');
 }else{
  const {error:erro}=await banco.from('empregados').insert({escritorio_id:escritorioId,...registro});
  conferirErro(erro,'Cadastrar empregado');
 }
 revalidatePath('/folha/empregados');return {sucesso:true,mensagem:id?'Empregado atualizado.':'Empregado cadastrado. Inclua outro se desejar.'};
}
export async function salvarEvento(dados:FormData){
 const {banco,escritorioId}=await exigirEdicao();
 const id=ler(dados,'id');if(id)uuid(id);
 const codigo=textoObrigatorio(dados.get('codigo'),'Código',20).trim();
 if(!/^[1-9]\d*$/.test(codigo))throw new Error('Informe um código numérico positivo, sem zeros à esquerda.');
 if(['1','26','27','28'].includes(codigo))throw new Error('Código reservado aos cálculos automáticos.');
 let configuracaoAnterior:Record<string,unknown>={};
 if(id){
  const {data:anterior,error:erroAnterior}=await banco.from('eventos_folha').select('codigo,configuracao_calculo').eq('escritorio_id',escritorioId).eq('id',id).maybeSingle();
  conferirErro(erroAnterior,'Consultar evento');
  if(!anterior)throw new Error('Evento não encontrado.');
  if(['1','26','27','28'].includes(anterior.codigo))throw new Error('Este evento é calculado automaticamente e não pode ser editado.');
  configuracaoAnterior=anterior.configuracao_calculo??{};
 }
 const tipo=ler(dados,'tipo_evento');if(!['PROVENTO','DESCONTO','INFORMATIVO'].includes(tipo))throw new Error('Tipo de evento inválido.');
 const booleano=(nome:string)=>ler(dados,nome)==='sim';
 const tipoReferencia=ler(dados,'tipo_referencia')||'VALOR';
 if(!['DIAS','HORAS','VALOR'].includes(tipoReferencia))throw new Error('Referência inválida.');
 const percentualAdicional=Number(ler(dados,'percentual_adicional')||0);
 if(!Number.isFinite(percentualAdicional)||percentualAdicional<0||percentualAdicional>300)throw new Error('Adicional inválido.');
 const cfg={...configuracaoAnterior,tipo_referencia:tipoReferencia,percentual_adicional:tipoReferencia==='HORAS'?percentualAdicional:0,calculo:tipoReferencia==='HORAS'?'HORAS_SALARIO':tipoReferencia==='DIAS'?'DIAS_SALARIO':'VALOR_INFORMADO',incide_inss:tipo!=='INFORMATIVO'&&booleano('incide_inss'),incide_fgts:tipo!=='INFORMATIVO'&&booleano('incide_fgts'),
 incide_irrf:tipo!=='INFORMATIVO'&&booleano('incide_irrf'),reduz_base:tipo==='DESCONTO'&&booleano('reduz_base')};
 const registro={codigo,nome:textoObrigatorio(dados.get('nome'),'Descrição'),tipo_evento:tipo,configuracao_calculo:cfg,ativo:ler(dados,'ativo')!=='nao'};
 if(id){const {error:erro}=await banco.from('eventos_folha').update(registro).eq('id',id).eq('escritorio_id',escritorioId);conferirErro(erro,'Editar evento');}
 else {const {error:erro}=await banco.from('eventos_folha').insert({escritorio_id:escritorioId,...registro});conferirErro(erro,'Cadastrar evento');}
 revalidatePath('/folha/eventos');return {sucesso:true,mensagem:'Evento salvo. Revise as incidências antes de utilizá-lo.'};
}
export async function salvarLancamentoEvento(dados:FormData){
 const {banco,escritorioId,usuario}=await exigirEdicao();
 const empregadoId=uuid(textoObrigatorio(dados.get('empregado_id'),'Empregado'));
 const eventoId=uuid(textoObrigatorio(dados.get('evento_id'),'Evento'));
 const competencia=validarCompetencia(textoObrigatorio(dados.get('competencia'),'Competência'));
 const id=ler(dados,'id');if(id)uuid(id);
 const {data:empregado,error:erroEmpregado}=await banco.from('empregados').select('id,cliente_id,salario,divisor_horas_mensais').eq('escritorio_id',escritorioId).eq('id',empregadoId).maybeSingle();
 conferirErro(erroEmpregado,'Consultar empregado');if(!empregado)throw new Error('Empregado não encontrado.');
 const {data:evento,error:erroEvento}=await banco.from('eventos_folha').select('id,codigo,ativo,configuracao_calculo').eq('escritorio_id',escritorioId).eq('id',eventoId).maybeSingle();
 conferirErro(erroEvento,'Consultar evento');if(!evento?.ativo)throw new Error('Evento indisponível.');
 const {data:fechado,error:erroFechado}=await banco.from('contracheques_folha').select('id').eq('escritorio_id',escritorioId).eq('empregado_id',empregadoId).eq('competencia',competencia).eq('situacao','CONFERIDO').maybeSingle();
 conferirErro(erroFechado);if(fechado)throw new Error('Folha conferida. Reabra a competência da empresa antes de alterar lançamentos.');
 const configuracao=(evento.configuracao_calculo||{}) as Record<string,unknown>;
 const tipoReferencia=referenciaDoEvento(configuracao);
 const quantidade=tipoReferencia==='VALOR'?null:Number(ler(dados,'quantidade_referencia'));
 const valorInformado=tipoReferencia==='VALOR'?valorMonetarioBr(ler(dados,'valor')):null;
 const calculado=calcularEventoVariavel({codigo:evento.codigo,tipo_referencia:tipoReferencia,
  quantidade_referencia:quantidade,valor_informado:valorInformado,salario:Number(empregado.salario),
  divisor_horas_mensais:empregado.divisor_horas_mensais?Number(empregado.divisor_horas_mensais):null,
  configuracao:{percentual_adicional:Number(configuracao.percentual_adicional??0),divisor_dias:Number(configuracao.divisor_dias??30)}});
 const registro={empregado_id:empregadoId,evento_id:eventoId,cliente_id:empregado.cliente_id,competencia,
  valor:calculado.valor,tipo_referencia:tipoReferencia,quantidade_referencia:quantidade,valor_unitario:calculado.valor_unitario,
  parametros_calculo:{percentual_adicional:Number(configuracao.percentual_adicional??0),divisor_dias:Number(configuracao.divisor_dias??30)},
  referencia:calculado.referencia||ler(dados,'referencia')||null,observacao:ler(dados,'observacao')||null};
 if(id){const {error:erro}=await banco.from('lancamentos_eventos_folha').update(registro).eq('id',id).eq('escritorio_id',escritorioId);conferirErro(erro,'Editar lançamento');}
 else {const {error:erro}=await banco.from('lancamentos_eventos_folha').insert({escritorio_id:escritorioId,criado_por:usuario.id,...registro});conferirErro(erro,'Lançar evento');}
 revalidatePath('/folha/lancamentos');return {sucesso:true,mensagem:'Evento lançado. É possível incluir outro sem fechar a janela.'};
}
export async function excluirLancamentoEvento(dados:FormData):Promise<void>{
 const {banco,escritorioId}=await exigirEdicao();const id=uuid(textoObrigatorio(dados.get('id'),'Lançamento'));
 const {data:registro}=await banco.from('lancamentos_eventos_folha').select('empregado_id,competencia').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
 if(!registro)throw new Error('Registro não localizado.');
 const {data:fechado}=await banco.from('contracheques_folha').select('id').eq('escritorio_id',escritorioId).eq('empregado_id',registro.empregado_id).eq('competencia',registro.competencia).eq('situacao','CONFERIDO').maybeSingle();
 if(fechado)throw new Error('Folha conferida. Reabra a competência da empresa antes de excluir lançamentos.');
 const {error:erro}=await banco.from('lancamentos_eventos_folha').delete().eq('escritorio_id',escritorioId).eq('id',id);
 conferirErro(erro,'Excluir lançamento');revalidatePath('/folha/lancamentos');
}
export async function aprovarRegrasFolha(dados:FormData){
 const {banco,escritorioId,usuario}=await exigirEdicao();
 const ano=Number(ler(dados,'ano'));if(ano!==2026)throw new Error('Somente as tabelas de 2026 estão previamente configuradas.');
 const {data:regras,error:erro}=await banco.from('versoes_regras_folha').select('id,tipo_regra,inicio_vigencia,fim_vigencia,aprovado_em').eq('escritorio_id',escritorioId).eq('inicio_vigencia','2026-01-01');
 conferirErro(erro);if(!regras||!['INSS','IRRF','FGTS'].every(tipo=>regras.some(r=>r.tipo_regra===tipo)))throw new Error('Execute a migração 004 para carregar as tabelas de 2026.');
 for(const regra of regras.filter(r=>['INSS','IRRF','FGTS'].includes(r.tipo_regra)&&!r.aprovado_em)){
  const {error:falha}=await banco.from('versoes_regras_folha').update({aprovado_em:new Date().toISOString(),aprovado_por:usuario.id}).eq('id',regra.id).eq('escritorio_id',escritorioId);
  conferirErro(falha,'Aprovar tabela');
 }
 revalidatePath('/folha/contracheques');return {sucesso:true,mensagem:'Tabelas 2026 aprovadas para cálculo da folha mensal básica.'};
}
export async function gerarContracheque(dados:FormData){
 const {banco,escritorioId,usuario}=await exigirEdicao();
 const empregadoId=uuid(textoObrigatorio(dados.get('empregado_id'),'Empregado'));
 const competenciaTexto=textoObrigatorio(dados.get('competencia'),'Competência');const competencia=validarCompetencia(competenciaTexto);
 const {data:empregado,error:erroEmpregado}=await banco.from('empregados').select('*').eq('id',empregadoId).eq('escritorio_id',escritorioId).maybeSingle();
 conferirErro(erroEmpregado);if(!empregado)throw new Error('Funcionário não encontrado.');
 if(empregado.situacao!=='ATIVO')throw new Error('Cálculo automático está restrito a empregados ativos, sem afastamento ou desligamento.');
 if(empregado.data_admissao>competencia)throw new Error('Admissão após o início do mês: o cálculo proporcional não está implantado.');
 const {data:existente}=await banco.from('contracheques_folha').select('id,situacao').eq('escritorio_id',escritorioId).eq('empregado_id',empregadoId).eq('competencia',competencia).maybeSingle();
 if(existente?.situacao==='CONFERIDO')throw new Error('Folha conferida. Reabra a competência da empresa antes do reprocessamento.');
 const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id,razao_social,cpf_cnpj').eq('id',empregado.cliente_id).eq('escritorio_id',escritorioId).maybeSingle();
 conferirErro(erroCliente);if(!cliente)throw new Error('Empresa não localizada.');
 const {data:endereco,error:erroEndereco}=await banco.from('enderecos_clientes').select('logradouro,numero,complemento,bairro,cidade,uf,cep').eq('escritorio_id',escritorioId).eq('cliente_id',cliente.id).order('principal',{ascending:false}).limit(1).maybeSingle();
 conferirErro(erroEndereco,'Consultar endereço do empregador');
 const enderecoTexto=endereco?[
   [endereco.logradouro,endereco.numero].filter(Boolean).join(', '),endereco.complemento,endereco.bairro,
   [endereco.cidade,endereco.uf].filter(Boolean).join('/'),endereco.cep?`CEP ${endereco.cep}`:''
  ].filter(Boolean).join(' - '):'';
 const {data:regras,error:erroRegra}=await banco.from('versoes_regras_folha').select('id,tipo_regra,inicio_vigencia,fim_vigencia,parametros,fundamento_legal,aprovado_em').eq('escritorio_id',escritorioId).lte('inicio_vigencia',competencia).not('aprovado_em','is',null);
 conferirErro(erroRegra);
 const para=(tipo:string)=>regras?.filter(r=>r.tipo_regra===tipo&&(!r.fim_vigencia||r.fim_vigencia>=competencia)).sort((a,b)=>b.inicio_vigencia.localeCompare(a.inicio_vigencia))[0];
 const regraInss=para('INSS'),regraIrrf=para('IRRF'),regraFgts=para('FGTS');
 if(!regraInss||!regraIrrf||!regraFgts)throw new Error('Tabelas INSS, IRRF e FGTS não aprovadas para a competência. Acesse Parâmetros da folha.');
 const {data:lancamentos,error:erroLancamentos}=await banco.from('lancamentos_eventos_folha').select('*').eq('escritorio_id',escritorioId).eq('empregado_id',empregadoId).eq('competencia',competencia).order('criado_em',{ascending:true});
 conferirErro(erroLancamentos);
 const ids=[...new Set((lancamentos??[]).map(l=>l.evento_id))];
 const {data:eventosBase,error:erroEventos}=ids.length?await banco.from('eventos_folha').select('*').eq('escritorio_id',escritorioId).in('id',ids):{data:[],error:null};
 conferirErro(erroEventos);
 const eventos:EventoCalculado[]=(lancamentos??[]).map(l=>{
  const evento=eventosBase?.find(e=>e.id===l.evento_id);if(!evento)throw new Error('Evento cadastrado não localizado.');
  const cfg=(evento.configuracao_calculo||{}) as Record<string,unknown>;
  // Em lançamentos anteriores à migração, preservar o valor histórico registrado.
  const tipoLancamento=l.tipo_referencia as 'DIAS'|'HORAS'|'VALOR'|null;
  const calculado=tipoLancamento==='DIAS'||tipoLancamento==='HORAS'?
   calcularEventoVariavel({codigo:evento.codigo,tipo_referencia:tipoLancamento,
    quantidade_referencia:Number(l.quantidade_referencia),salario:Number(empregado.salario),
    divisor_horas_mensais:empregado.divisor_horas_mensais?Number(empregado.divisor_horas_mensais):null,
    configuracao:{percentual_adicional:Number((l.parametros_calculo as Record<string,unknown>|null)?.percentual_adicional??cfg.percentual_adicional??0),
      divisor_dias:Number((l.parametros_calculo as Record<string,unknown>|null)?.divisor_dias??cfg.divisor_dias??30)}}):null;
  return {codigo:evento.codigo,descricao:evento.nome,referencia:calculado?.referencia||l.referencia||'',
   tipo:evento.tipo_evento,valor:calculado?.valor??Number(l.valor),
   incide_inss:cfg.incide_inss===true,incide_irrf:cfg.incide_irrf===true,
   incide_fgts:cfg.incide_fgts===true,reduz_base:cfg.reduz_base===true};
 });
 const parametros:ParametrosFolha={inss:regraInss.parametros,irrf:regraIrrf.parametros,fgts:regraFgts.parametros,
 referencias:{INSS:regraInss.id,IRRF:regraIrrf.id,FGTS:regraFgts.id}};
 const memoria=calcularContracheque({competencia:competenciaTexto,
  empresa:{nome:cliente.razao_social,cidade:endereco?.cidade?[endereco.cidade,endereco.uf].filter(Boolean).join(' - '):'',endereco:enderecoTexto,cnpj:cliente.cpf_cnpj},
  funcionario:{nome:empregado.nome_completo,codigo:empregado.codigo_funcionario||'0001',cpf:empregado.cpf||'',cbo:empregado.cbo||'',cargo:empregado.cargo||'',salario_base:Number(empregado.salario)},
  dependentes_irrf:Number(empregado.dependentes_irrf||0),eventos,parametros});
 const registro={escritorio_id:escritorioId,cliente_id:cliente.id,empregado_id:empregadoId,competencia,
  situacao:'EM_CONFERENCIA',memoria_calculo:memoria,gerado_por:usuario.id,gerado_em:new Date().toISOString()};
 if(existente){const {error:erro}=await banco.from('contracheques_folha').update(registro).eq('id',existente.id).eq('escritorio_id',escritorioId);conferirErro(erro,'Atualizar contracheque');}
 else {const {error:erro}=await banco.from('contracheques_folha').insert(registro);conferirErro(erro,'Gerar contracheque');}
 revalidatePath('/folha/contracheques');return {sucesso:true,mensagem:'Contracheque calculado. Confira valores e abra o PDF na lista.'};
}
export async function confirmarContracheque(dados:FormData):Promise<void>{
 const {banco,escritorioId}=await exigirEdicao();const id=uuid(textoObrigatorio(dados.get('id'),'Contracheque'));
 const {error:erro}=await banco.from('contracheques_folha').update({situacao:'CONFERIDO'}).eq('id',id).eq('escritorio_id',escritorioId).eq('situacao','EM_CONFERENCIA');
 conferirErro(erro,'Conferir contracheque');revalidatePath('/folha/contracheques');
}

/** Reabre TODOS os recibos da empresa na competência. PDF antigo fica indisponível até o novo processamento. */
export async function reabrirFolhaEmpresa(dados:FormData):Promise<{sucesso:boolean;mensagem:string}>{
 const {banco,escritorioId}=await exigirEdicao();
 const clienteId=uuid(textoObrigatorio(dados.get('cliente_id'),'Empresa'));
 const competencia=validarCompetencia(textoObrigatorio(dados.get('competencia'),'Competência'));
 const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id').eq('escritorio_id',escritorioId).eq('id',clienteId).maybeSingle();
 conferirErro(erroCliente,'Consultar empresa');if(!cliente)throw new Error('Empresa não encontrada.');
 const {error:erro}=await banco.from('contracheques_folha').update({situacao:'REPROCESSAMENTO_PENDENTE'})
  .eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('competencia',competencia);
 conferirErro(erro,'Reabrir folha');
 revalidatePath('/folha/contracheques');revalidatePath('/folha/lancamentos');
 return {sucesso:true,mensagem:'Folha reaberta. Edite os lançamentos e reprocesse a empresa. PDFs antigos ficam indisponíveis.'};
}

/** Processa a competência pelo CLIENTE, gerando um recibo para cada empregado ativo elegível. */
export async function processarFolhaEmpresa(dados:FormData):Promise<{sucesso:boolean;mensagem:string}>{
 const {banco,escritorioId}=await exigirEdicao();
 const clienteId=uuid(textoObrigatorio(dados.get('cliente_id'),'Empresa'));
 const competenciaTexto=textoObrigatorio(dados.get('competencia'),'Competência');
 const competencia=validarCompetencia(competenciaTexto);
 const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id').eq('id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
 conferirErro(erroCliente,'Consultar empresa');if(!cliente)throw new Error('Empresa não localizada.');
 const {data:empregados,error:erroEmpregados}=await banco.from('empregados')
  .select('id,nome_completo,situacao,data_admissao,data_desligamento')
  .eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).order('nome_completo');
 conferirErro(erroEmpregados,'Consultar funcionários');
 const elegiveis=(empregados??[]).filter(empregado=>empregado.situacao==='ATIVO'&&empregado.data_admissao<=competencia
  && !empregado.data_desligamento);
 if(!elegiveis.length)throw new Error('Nenhum empregado ativo e elegível para a competência selecionada.');
 if(elegiveis.length>40)throw new Error('Esta versão processa até 40 funcionários por operação. É necessário implementar processamento em lote para empresas maiores.');
 const {data:conferidos,error:erroConferidos}=await banco.from('contracheques_folha')
  .select('empregado_id').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId)
  .eq('competencia',competencia).eq('situacao','CONFERIDO');
 conferirErro(erroConferidos,'Verificar fechamento');
 if(conferidos?.length)throw new Error('Há contracheques conferidos. Reabra a folha da empresa antes de reprocessar.');
 let processados=0;
 for(const empregado of elegiveis){
  const dadosFuncionario=new FormData();dadosFuncionario.set('empregado_id',empregado.id);dadosFuncionario.set('competencia',competenciaTexto);
  try {await gerarContracheque(dadosFuncionario);processados++;}
  catch(erro){
   revalidatePath('/folha/contracheques');
   const motivo=erro instanceof Error?erro.message:'Falha inesperada';
   return {sucesso:false,mensagem:`Processamento parcial: ${processados} de ${elegiveis.length} empregados concluídos. Falha em ${empregado.nome_completo}: ${motivo}. Corrija e processe novamente a empresa.`};
  }
 }
 revalidatePath('/folha/contracheques');
 return {sucesso:true,mensagem:`${processados} contracheque(s) calculado(s) para a empresa. Confira cada recibo antes de finalizar.`};
}
