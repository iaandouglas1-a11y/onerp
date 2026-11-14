'use server';
import {revalidatePath} from 'next/cache';
import {exigirEdicao} from '@/lib/seguranca/contexto';
import {conferirErro} from '@/lib/utilitarios/erros';
import {calcularDecimoTerceiro,avosDecimoTerceiro,type TipoDecimoTerceiro} from './decimo-terceiro';
import type {ParametrosFolha} from './calculos';
const rota='/folha/decimo-terceiro';
export async function processarDecimoTerceiro(dados:FormData):Promise<{sucesso:boolean;mensagem:string}>{
 const {banco,escritorioId,usuario}=await exigirEdicao();
 const clienteId=String(dados.get('cliente_id')||'');
 const tipo=String(dados.get('tipo')||'') as TipoDecimoTerceiro;
 const ano=Number(dados.get('ano'));
 if(!/^[0-9a-f-]{36}$/i.test(clienteId)||!['ADIANTAMENTO_13','SEGUNDA_PARCELA_13'].includes(tipo)||ano!==2026)
  throw new Error('Empresa, tipo ou exercício inválido.');
 // Ajustes salariais informados apenas para processamento, permanecendo na memória histórica.
 const adicionais=Number(dados.get('adicionais')||0),mediaVariavel=Number(dados.get('media_variavel')||0);
 if(![adicionais,mediaVariavel].every(v=>Number.isFinite(v)&&v>=0&&v<=10000000))throw new Error('Valores adicionais inválidos.');
 if((adicionais||mediaVariavel)&&String(dados.get('confirmacao_medias'))!=='sim')throw new Error('Confirme a conferência dos adicionais e médias.');
 const {data:cliente,error:erroCliente}=await banco.from('clientes').select('id,razao_social,cpf_cnpj').eq('id',clienteId).eq('escritorio_id',escritorioId).maybeSingle();
 conferirErro(erroCliente);if(!cliente)throw new Error('Empresa não localizada.');
 const {data:empregados,error:erroEmpregados}=await banco.from('empregados').select('*').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('situacao','ATIVO').order('nome_completo');
 conferirErro(erroEmpregados);if(!empregados?.length)throw new Error('Não há empregados ativos para processamento.');
 if(empregados.length>40)throw new Error('Operação limitada a 40 empregados.');
 // Dados de parâmetros são os mesmos já aprovados para folha mensal.
 const dataRegra=`${ano}-12-01`;
 const {data:regras,error:erroRegras}=await banco.from('versoes_regras_folha').select('id,tipo_regra,inicio_vigencia,fim_vigencia,parametros,aprovado_em').eq('escritorio_id',escritorioId).lte('inicio_vigencia',dataRegra).not('aprovado_em','is',null);
 conferirErro(erroRegras);
 const buscar=(nome:string)=>regras?.filter(r=>r.tipo_regra===nome&&(!r.fim_vigencia||r.fim_vigencia>=dataRegra)).sort((a,b)=>b.inicio_vigencia.localeCompare(a.inicio_vigencia))[0];
 const ri=buscar('INSS'),rr=buscar('IRRF'),rf=buscar('FGTS');
 if(!ri||!rr||!rf)throw new Error('Aprove as tabelas INSS, IRRF e FGTS de 2026 na Folha antes de processar.');
 const parametros:ParametrosFolha={inss:ri.parametros,irrf:rr.parametros,fgts:rf.parametros,referencias:{INSS:ri.id,IRRF:rr.id,FGTS:rf.id}};
 const {data:endereco}=await banco.from('enderecos_clientes').select('cidade,uf,logradouro,numero').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).order('principal',{ascending:false}).limit(1).maybeSingle();
 const {data:recibos,error:erroRecibos}=await banco.from('contracheques_decimo_terceiro').select('id,empregado_id,tipo,situacao,memoria_calculo').eq('escritorio_id',escritorioId).eq('cliente_id',clienteId).eq('ano',ano);
 conferirErro(erroRecibos,'Consultar 13º (aplique a migração 005)');
 const saida:{empregado:string;memoria:ReturnType<typeof calcularDecimoTerceiro>;id:string|null}[]=[];
 for(const empregado of empregados){
  const avos=avosDecimoTerceiro(empregado.data_admissao,ano);
  if(avos===0)continue;
  const atual=recibos?.find(r=>r.empregado_id===empregado.id&&r.tipo===tipo);
  if(atual&&atual.situacao!=='EM_CONFERENCIA')throw new Error(`O 13º de ${empregado.nome_completo} está conferido. Reabra o recibo antes de recalcular.`);
  const adiantamento=recibos?.find(r=>r.empregado_id===empregado.id&&r.tipo==='ADIANTAMENTO_13');
  if(tipo==='SEGUNDA_PARCELA_13'&&!adiantamento)throw new Error(`Gere e confira o adiantamento de ${empregado.nome_completo} antes da segunda parcela.`);
  if(tipo==='SEGUNDA_PARCELA_13'&&adiantamento?.situacao!=='PAGO')throw new Error(`Registre o pagamento efetivo do adiantamento de ${empregado.nome_completo} antes da segunda parcela.`);
  const memoriaAdiantamento=adiantamento?.memoria_calculo as {total_proventos?:number}|undefined;
  const antecipado=tipo==='SEGUNDA_PARCELA_13'?Number(memoriaAdiantamento?.total_proventos):0;
  if(!Number.isFinite(antecipado))throw new Error('Histórico do adiantamento inválido.');
  const memoria=calcularDecimoTerceiro({ano:2026,tipo,avos,adicionais,mediaVariavel,adiantamentoPago:antecipado,
    empresa:{nome:cliente.razao_social,cnpj:cliente.cpf_cnpj,cidade:[endereco?.cidade,endereco?.uf].filter(Boolean).join(' - '),endereco:[endereco?.logradouro,endereco?.numero].filter(Boolean).join(', ')},
    funcionario:{nome:empregado.nome_completo,codigo:empregado.codigo_funcionario||'0001',cpf:empregado.cpf||'',cbo:empregado.cbo||'',cargo:empregado.cargo||'',salario_base:Number(empregado.salario)},
    dependentes:Number(empregado.dependentes_irrf||0),parametros});
  saida.push({empregado:empregado.id,memoria,id:atual?.id||null});
 }
 if(!saida.length)throw new Error('Nenhum empregado com avos elegíveis.');
 // Calcula todos antes de gravar. Recibos conferidos não são sobrescritos.
 let concluidos=0;
 for(const item of saida){
  const registro={escritorio_id:escritorioId,cliente_id:clienteId,empregado_id:item.empregado,ano,tipo,situacao:'EM_CONFERENCIA',memoria_calculo:item.memoria,gerado_por:usuario.id,gerado_em:new Date().toISOString()};
  const {error}=item.id?await banco.from('contracheques_decimo_terceiro').update(registro).eq('id',item.id).eq('escritorio_id',escritorioId).eq('situacao','EM_CONFERENCIA'):
   await banco.from('contracheques_decimo_terceiro').insert(registro);
  conferirErro(error,'Salvar contracheque de 13º');concluidos++;
 }
 revalidatePath(rota);return {sucesso:true,mensagem:`${concluidos} contracheques de ${tipo==='ADIANTAMENTO_13'?'adiantamento':'2ª parcela'} calculados. Confira antes de finalizar.`};
}
export async function conferirDecimoTerceiro(dados:FormData):Promise<void>{
 const {banco,escritorioId}=await exigirEdicao();const id=String(dados.get('id')||'');
 if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Identificador inválido.');
 const {data,error}=await banco.from('contracheques_decimo_terceiro').update({situacao:'CONFERIDO'}).eq('id',id).eq('escritorio_id',escritorioId).eq('situacao','EM_CONFERENCIA').select('id').maybeSingle();
 conferirErro(error);if(!data)throw new Error('Recibo não encontrado ou já conferido.');revalidatePath(rota);
}
export async function reabrirDecimoTerceiro(dados:FormData):Promise<void>{
 const {banco,escritorioId}=await exigirEdicao();const id=String(dados.get('id')||'');
 if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('Identificador inválido.');
 const {data:recibo,error:erroConsulta}=await banco.from('contracheques_decimo_terceiro').select('id,tipo,ano,empregado_id').eq('id',id).eq('escritorio_id',escritorioId).maybeSingle();
 conferirErro(erroConsulta);if(!recibo)throw new Error('Recibo não localizado.');
 if(recibo.tipo==='ADIANTAMENTO_13'){
  const {data:posterior,error:erroPosterior}=await banco.from('contracheques_decimo_terceiro').select('id').eq('escritorio_id',escritorioId).eq('empregado_id',recibo.empregado_id).eq('ano',recibo.ano).eq('tipo','SEGUNDA_PARCELA_13').limit(1);
  conferirErro(erroPosterior);if(posterior?.length)throw new Error('Há segunda parcela processada. Reabra e remova/retifique a segunda parcela antes de alterar o adiantamento.');
 }
 const {error}=await banco.from('contracheques_decimo_terceiro').update({situacao:'EM_CONFERENCIA',pago_em:null}).eq('id',id).eq('escritorio_id',escritorioId);
 conferirErro(error);revalidatePath(rota);
}

/** Registro explícito do pagamento efetivo, separado da simples conferência contábil. */
export async function registrarPagamento13(dados:FormData):Promise<void>{
 const {banco,escritorioId}=await exigirEdicao();
 const id=String(dados.get('id')||'');const data=String(dados.get('data_pagamento')||'');
 if(!/^[0-9a-f-]{36}$/i.test(id)||!/^2026-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(data)||Number.isNaN(new Date(`${data}T12:00:00Z`).getTime())||new Date(`${data}T12:00:00Z`).toISOString().slice(0,10)!==data)
  throw new Error('Identificador ou data inválidos.');
 const {data:atual,error:erro}=await banco.from('contracheques_decimo_terceiro').select('tipo').eq('id',id).eq('escritorio_id',escritorioId).eq('situacao','CONFERIDO').maybeSingle();
 conferirErro(erro);if(!atual)throw new Error('Recibo precisa estar conferido e não pago.');
 const {data:atualizado,error:erroSalvar}=await banco.from('contracheques_decimo_terceiro').update({situacao:'PAGO',pago_em:data}).eq('id',id).eq('escritorio_id',escritorioId).eq('situacao','CONFERIDO').select('id').maybeSingle();
 conferirErro(erroSalvar);if(!atualizado)throw new Error('Pagamento não registrado.');
 revalidatePath(rota);
}
