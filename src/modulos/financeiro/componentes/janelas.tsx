import type {ReactNode} from 'react';
import {JanelaModal} from '@/componentes/globais/janela-modal';
import {FormularioContinuo} from '@/componentes/globais/formulario-continuo';
import {Campo} from '@/componentes/globais/elementos';
import type {DadosFinanceiros} from '../modelos';
import {salvarCategoriaFinanceira,salvarContaFinanceira,salvarHonorario,gerarCobrancasRecorrentes,salvarCobranca,registrarRecebimento,salvarDespesa,registrarPagamento,salvarMovimentoFinanceiro,transferirEntreContas} from '../acoes';
import {mesAtual} from '@/lib/utilitarios/formatacao';

const dataHoje=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
type Propriedades={dados:DadosFinanceiros;tipo?:string;id?:string;fecharEm:string;clienteId?:string};
export function JanelasFinanceiras({dados,tipo,id,fecharEm,clienteId}:Propriedades){
 if(!tipo)return null;
 const clientes=dados.clientes.map(c=>({valor:c.id,rotulo:c.razao_social}));
 const contas=dados.contas.filter(c=>c.ativo).map(c=>({valor:c.id,rotulo:c.nome}));
 const servicos=dados.servicos.map(s=>({valor:s.id,rotulo:s.nome}));
 const categorias=(classe:'RECEITA'|'DESPESA')=>dados.categorias.filter(c=>c.ativo&&c.tipo===classe).map(c=>({valor:c.id,rotulo:c.nome}));
 const botao=(rotulo='Salvar')=><div className="largo linha" style={{justifyContent:'flex-end',marginTop:8}}><button className="botao primario" type="submit">{rotulo}</button></div>;
 const campoId=(valor?:string)=><input name="id" type="hidden" value={valor||''}/>;
 const idAtual=id||'';
 const comum=(acao:(formData:FormData)=>Promise<{sucesso?:boolean;mensagem?:string}|undefined>,registro:{id:string}|undefined,conteudo:ReactNode,titulo:string)=>
  <JanelaModal titulo={titulo} fecharEm={fecharEm} largura="ampla"><FormularioContinuo key={`${tipo}-${idAtual}`} acao={acao} modo={registro?'edicao':'cadastro'} rotaNovoAposEdicao={`${fecharEm}${fecharEm.includes('?')?'&':'?'}modal=${tipo}`} className="grade-formulario">
  {campoId(registro?.id as string|undefined)}{conteudo}{botao(registro?'Salvar alterações':'Salvar')}</FormularioContinuo></JanelaModal>;
 if(tipo==='categoria'){
 const registro=dados.categorias.find(c=>c.id===idAtual);
 return comum(salvarCategoriaFinanceira,registro,<><Campo nome="nome" rotulo="Nome da categoria" obrigatorio padrao={registro?.nome}/><Campo nome="tipo" rotulo="Tipo" obrigatorio padrao={registro?.tipo||'DESPESA'} opcoes={[{valor:'RECEITA',rotulo:'Receita'},{valor:'DESPESA',rotulo:'Despesa'}]}/><label className="campo campo-checkbox"><input name="ativo" type="checkbox" defaultChecked={registro?registro.ativo:true}/><span>Ativa</span></label></>,registro?'Editar categoria':'Nova categoria');
 }
 if(tipo==='conta'){
 const registro=dados.contas.find(c=>c.id===idAtual);
 return comum(salvarContaFinanceira,registro,<><Campo nome="nome" rotulo="Banco ou caixa" obrigatorio padrao={registro?.nome}/><Campo nome="tipo" rotulo="Tipo" obrigatorio padrao={registro?.tipo||'BANCO'} opcoes={[{valor:'BANCO',rotulo:'Banco'},{valor:'CAIXA',rotulo:'Caixa'}]}/><Campo nome="codigo_banco" rotulo="Código do banco (opcional)" padrao={registro?.codigo_banco}/><Campo nome="saldo_inicial" rotulo="Saldo inicial (R$)" obrigatorio padrao={registro?.saldo_inicial??'0'}/><Campo nome="data_saldo_inicial" rotulo="Data inicial de movimentação" tipo="date" padrao={registro?.data_saldo_inicial}/><label className="campo campo-checkbox"><input name="ativo" type="checkbox" defaultChecked={registro?registro.ativo:true}/><span>Conta ativa</span></label><div className="largo aviso-configuracao">Informe o saldo inicial apenas uma vez. Movimentações anteriores à data inicial não entram no saldo calculado.</div></>,registro?'Editar conta':'Nova conta');
 }
 if(tipo==='honorario'){
 const registro=dados.honorarios.find(c=>c.id===idAtual);
 return comum(salvarHonorario,registro,<><Campo nome="cliente_id" rotulo="Cliente" obrigatorio padrao={registro?.cliente_id||clienteId} opcoes={clientes}/><Campo nome="servico_id" rotulo="Serviço contratado" padrao={registro?.servico_id} opcoes={servicos}/><div className="largo"><Campo nome="descricao" rotulo="Descrição" obrigatorio padrao={registro?.descricao}/></div><Campo nome="valor" rotulo="Valor mensal (R$)" obrigatorio padrao={registro?.valor}/><Campo nome="dia_vencimento" rotulo="Dia do vencimento" tipo="number" min="1" max="31" obrigatorio padrao={registro?.dia_vencimento??10}/><Campo nome="data_inicio" rotulo="Início" tipo="date" obrigatorio padrao={registro?.data_inicio||dataHoje()}/><Campo nome="data_fim" rotulo="Término (opcional)" tipo="date" padrao={registro?.data_fim}/><label className="campo campo-checkbox"><input name="ativo" type="checkbox" defaultChecked={registro?registro.ativo:true}/><span>Contrato ativo</span></label></>,registro?'Editar honorário':'Novo honorário recorrente');
 }
 if(tipo==='gerar')return <JanelaModal titulo="Gerar cobranças recorrentes" descricao="Uma cobrança por contrato e competência; a operação não cria duplicidades." fecharEm={fecharEm}><FormularioContinuo acao={gerarCobrancasRecorrentes} modo="acao" className="grade-formulario"><Campo nome="competencia" rotulo="Competência" tipo="month" obrigatorio padrao={mesAtual()}/>{botao('Gerar cobranças')}</FormularioContinuo></JanelaModal>;
 if(tipo==='cobranca'){
 const registro=dados.receber.find(c=>c.id===idAtual);
 return comum(salvarCobranca,registro,<><Campo nome="cliente_id" rotulo="Cliente" obrigatorio padrao={registro?.cliente_id||clienteId} opcoes={clientes}/><Campo nome="descricao" rotulo="Descrição da cobrança" obrigatorio padrao={registro?.descricao}/><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={registro?.competencia?.slice(0,7)||mesAtual()}/><Campo nome="data_vencimento" rotulo="Vencimento" tipo="date" obrigatorio padrao={registro?.data_vencimento||dataHoje()}/><Campo nome="valor" rotulo="Valor (R$)" obrigatorio padrao={registro?.valor}/><div className="largo aviso-configuracao">Cobranças avulsas são independentes dos honorários recorrentes.</div></>,registro?'Editar cobrança avulsa':'Nova cobrança avulsa');
 }
 if(tipo==='recebimento'){
 const registro=dados.receber.find(c=>c.id===idAtual);
 if(!registro)return null;
 return <JanelaModal titulo="Baixar recebimento" descricao={registro.descricao} fecharEm={fecharEm}><FormularioContinuo acao={registrarRecebimento} modo="cadastro" manterCampos={['conta_receber_id','conta_financeira_id']} className="grade-formulario"><input type="hidden" name="conta_receber_id" value={registro.id}/><Campo nome="conta_financeira_id" rotulo="Conta de entrada" obrigatorio opcoes={contas}/><Campo nome="data_pagamento" rotulo="Data do recebimento" tipo="date" obrigatorio padrao={dataHoje()}/><Campo nome="valor" rotulo="Valor recebido (R$)" obrigatorio/>{botao('Registrar recebimento')}</FormularioContinuo></JanelaModal>;
 }
 if(tipo==='despesa'){
 const registro=dados.pagar.find(c=>c.id===idAtual);
 return comum(salvarDespesa,registro,<><Campo nome="descricao" rotulo="Descrição" obrigatorio padrao={registro?.descricao}/><Campo nome="categoria_id" rotulo="Categoria" padrao={registro?.categoria_id} opcoes={categorias('DESPESA')}/><Campo nome="cliente_id" rotulo="Cliente relacionado (opcional)" padrao={registro?.cliente_id||clienteId} opcoes={clientes}/><Campo nome="competencia" rotulo="Competência" tipo="month" padrao={registro?.competencia?.slice(0,7)||mesAtual()}/><Campo nome="data_vencimento" rotulo="Vencimento" tipo="date" obrigatorio padrao={registro?.data_vencimento||dataHoje()}/><Campo nome="valor" rotulo="Valor (R$)" obrigatorio padrao={registro?.valor}/></>,registro?'Editar conta a pagar':'Nova conta a pagar');
 }
 if(tipo==='pagamento'){
 const registro=dados.pagar.find(c=>c.id===idAtual);if(!registro)return null;
 return <JanelaModal titulo="Baixar pagamento" descricao={registro.descricao} fecharEm={fecharEm}><FormularioContinuo acao={registrarPagamento} modo="cadastro" manterCampos={['conta_pagar_id','conta_financeira_id']} className="grade-formulario"><input type="hidden" name="conta_pagar_id" value={registro.id}/><Campo nome="conta_financeira_id" rotulo="Conta de saída" obrigatorio opcoes={contas}/><Campo nome="data_pagamento" rotulo="Data do pagamento" tipo="date" obrigatorio padrao={dataHoje()}/><Campo nome="valor" rotulo="Valor pago (R$)" obrigatorio/>{botao('Registrar pagamento')}</FormularioContinuo></JanelaModal>;
 }
 if(tipo==='movimento'){
 const registro=dados.movimentos.find(c=>c.id===idAtual&&c.origem_registro==='MANUAL');
 return comum(salvarMovimentoFinanceiro,registro,<><Campo nome="tipo" rotulo="Tipo" obrigatorio padrao={registro?.tipo||'DESPESA'} opcoes={[{valor:'RECEITA',rotulo:'Receita'},{valor:'DESPESA',rotulo:'Despesa'}]}/><Campo nome="conta_financeira_id" rotulo="Conta financeira" obrigatorio padrao={registro?.conta_financeira_id} opcoes={contas}/><Campo nome="categoria_id" rotulo="Categoria (opcional)" padrao={registro?.categoria_id} opcoes={[...categorias('RECEITA'),...categorias('DESPESA')]}/><Campo nome="cliente_id" rotulo="Cliente relacionado" padrao={registro?.cliente_id||clienteId} opcoes={clientes}/><Campo nome="data_movimento" rotulo="Data" tipo="date" obrigatorio padrao={registro?.data_movimento||dataHoje()}/><Campo nome="valor" rotulo="Valor (R$)" obrigatorio padrao={registro?.valor}/><div className="largo"><Campo nome="descricao" rotulo="Histórico" obrigatorio padrao={registro?.descricao}/></div><div className="largo aviso-configuracao">Categoria deve corresponder ao tipo selecionado. Para baixar honorários ou despesas já provisionados, utilize Recebimentos/Despesas, não esta opção.</div></>,registro?'Editar movimentação':'Nova movimentação manual');
 }
 if(tipo==='transferencia')return <JanelaModal titulo="Transferência entre contas" fecharEm={fecharEm}><FormularioContinuo acao={transferirEntreContas} className="grade-formulario"><Campo nome="conta_origem_id" rotulo="Conta de origem" obrigatorio opcoes={contas}/><Campo nome="conta_destino_id" rotulo="Conta de destino" obrigatorio opcoes={contas}/><Campo nome="data_movimento" rotulo="Data" tipo="date" obrigatorio padrao={dataHoje()}/><Campo nome="valor" rotulo="Valor (R$)" obrigatorio/><div className="largo"><Campo nome="descricao" rotulo="Histórico"/></div>{botao('Transferir')}</FormularioContinuo></JanelaModal>;
 return null;
}
