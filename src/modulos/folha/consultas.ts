import 'server-only';
import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { consultarTodasPaginas } from '@/lib/utilitarios/paginacao';

export type Empregado = {id:string;escritorio_id:string;cliente_id:string;nome_completo:string;cpf:string|null;
 codigo_funcionario:string|null;cargo:string|null;cbo:string|null;salario:number;data_admissao:string;
 data_desligamento:string|null;data_nascimento:string|null;dependentes_irrf:number;jornada_trabalho:string|null;
 situacao:'ATIVO'|'AFASTADO'|'DESLIGADO';observacoes:string|null};
export type EventoFolha = {id:string;codigo:string;nome:string;tipo_evento:'PROVENTO'|'DESCONTO'|'INFORMATIVO';
 configuracao_calculo:Record<string,unknown>;ativo:boolean};
export type LancamentoFolha = {id:string;empregado_id:string;evento_id:string;cliente_id:string;competencia:string;
 referencia:string|null;valor:number;observacao:string|null};
export type ContrachequeFolha = {id:string;empregado_id:string;cliente_id:string;competencia:string;
 situacao:string;gerado_em:string;memoria_calculo:Record<string,unknown>};

export async function listarEmpregados(){
 const {banco,escritorioId}=await exigirEscritorio();
 return consultarTodasPaginas<Empregado>((inicio,fim)=>banco.from('empregados').select('*').eq('escritorio_id',escritorioId).order('nome_completo').range(inicio,fim));
}
export async function listarEventosFolha(){
 const {banco,escritorioId}=await exigirEscritorio();
 return consultarTodasPaginas<EventoFolha>((inicio,fim)=>banco.from('eventos_folha').select('*').eq('escritorio_id',escritorioId).order('codigo').range(inicio,fim));
}
export async function listarLancamentosFolha(competencia:string){
 const {banco,escritorioId}=await exigirEscritorio();
 return consultarTodasPaginas<LancamentoFolha>((inicio,fim)=>banco.from('lancamentos_eventos_folha').select('*').eq('escritorio_id',escritorioId).eq('competencia',`${competencia}-01`).order('criado_em',{ascending:false}).range(inicio,fim));
}
export async function listarContracheques(competencia:string){
 const {banco,escritorioId}=await exigirEscritorio();
 return consultarTodasPaginas<ContrachequeFolha>((inicio,fim)=>banco.from('contracheques_folha').select('id,empregado_id,cliente_id,competencia,situacao,gerado_em,memoria_calculo').eq('escritorio_id',escritorioId).eq('competencia',`${competencia}-01`).order('gerado_em',{ascending:false}).range(inicio,fim));
}
