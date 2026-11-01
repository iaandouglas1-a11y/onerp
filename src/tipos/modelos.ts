export interface Cliente {
  id: string; escritorio_id: string; tipo_pessoa: 'PF'|'PJ'; razao_social: string;
  nome_fantasia: string|null; cpf_cnpj: string; inscricao_estadual: string|null;
  inscricao_municipal: string|null; regime_tributario: string|null; cnae_principal: string|null;
  cnaes_secundarios: string[]; data_abertura: string|null; situacao: string;
  responsavel_interno_id: string|null; observacoes: string|null; criado_em: string; atualizado_em: string;
}
export interface MovimentoFiscal {
  id: string; escritorio_id: string; cliente_id: string; tipo_movimento: 'RECEITA'|'ENTRADA'|'DESPESA';
  atividade_receita: string|null; categoria_id: string|null; data_movimento: string;
  competencia: string; descricao: string|null; numero_documento: string|null;
  valor: number; origem: string; criado_em: string;
}
export type LinhaSimples = Record<string, string | number | boolean | null | undefined>;
