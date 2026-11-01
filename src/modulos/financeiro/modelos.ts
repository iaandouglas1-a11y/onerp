export type TipoCategoria = 'RECEITA'|'DESPESA';
export type TipoMovimento = 'RECEITA'|'DESPESA'|'TRANSFERENCIA';
export type SituacaoReceber='ABERTO'|'PARCIAL'|'RECEBIDO'|'CANCELADO';
export type SituacaoPagar='ABERTO'|'PARCIAL'|'PAGO'|'CANCELADO';
export interface ClienteFinanceiro {id:string;razao_social:string;nome_fantasia?:string|null;cpf_cnpj?:string|null;situacao?:string}
export interface ServicoFinanceiro {id:string;nome:string;codigo:string}
export interface CategoriaFinanceira {id:string;nome:string;tipo:TipoCategoria;ativo:boolean}
export interface ContaFinanceira {id:string;nome:string;tipo:'BANCO'|'CAIXA';codigo_banco:string|null;ativo:boolean;saldo_inicial:number;data_saldo_inicial:string|null}
export interface ContratoHonorarios {id:string;cliente_id:string;servico_id:string|null;descricao:string;valor:number;dia_vencimento:number|null;data_inicio:string;data_fim:string|null;ativo:boolean}
export interface ContaReceber {id:string;cliente_id:string;contrato_honorarios_id:string|null;descricao:string;competencia:string|null;data_vencimento:string;valor:number;situacao:SituacaoReceber;tipo_cobranca?:'RECORRENTE'|'AVULSO';categoria_id?:string|null}
export interface ContaPagar {id:string;categoria_id:string|null;cliente_id:string|null;descricao:string;competencia:string|null;data_vencimento:string;valor:number;situacao:SituacaoPagar}
export interface MovimentoFinanceiro {id:string;conta_financeira_id:string;categoria_id:string|null;cliente_id:string|null;tipo:TipoMovimento;data_movimento:string;valor:number;descricao:string|null;origem_registro?:string;grupo_transferencia?:string|null;sentido_transferencia?:'ENTRADA'|'SAIDA'|null;conta_receber_id?:string|null;conta_pagar_id?:string|null}
export interface RecebimentoFinanceiro {id:string;conta_receber_id:string;movimentacao_financeira_id:string|null;data_pagamento:string;valor:number}
export interface PagamentoFinanceiro {id:string;conta_pagar_id:string;movimentacao_financeira_id:string|null;data_pagamento:string;valor:number}
export interface DadosFinanceiros {
 clientes:ClienteFinanceiro[];servicos:ServicoFinanceiro[];categorias:CategoriaFinanceira[];contas:ContaFinanceira[];honorarios:ContratoHonorarios[];
 receber:ContaReceber[];pagar:ContaPagar[];movimentos:MovimentoFinanceiro[];recebimentos:RecebimentoFinanceiro[];pagamentos:PagamentoFinanceiro[];
}
