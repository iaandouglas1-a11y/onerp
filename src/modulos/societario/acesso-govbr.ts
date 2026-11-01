import 'server-only';

import { exigirEscritorio } from '@/lib/seguranca/contexto';
import { criarClienteAdministrador } from '@/lib/supabase/administrador';
import { criptografarCredencial } from '@/lib/seguranca/cofre';
import { conferirErro } from '@/lib/utilitarios/erros';
import { digitos } from '@/lib/utilitarios/formatacao';

const NOME_PORTAL = 'gov.br';

export type ResumoAcessoGovBr = { cpf: string; possuiSenha: true };

type CredencialExistente = { id: string; identificacao_usuario: string | null };

export type AlteracaoAcessoGovBr = {
  cpf: string;
  conteudoCriptografado: string;
  credencialId: string | null;
};

export function cofreGovBrConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.COFRE_CHAVE_CRIPTOGRAFIA);
}

/** O identificador pertence ao titular da conta gov.br, não necessariamente ao cliente PJ. */
export function validarCpfGovBr(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (let posicao = 9; posicao < 11; posicao++) {
    const soma = cpf.slice(0, posicao).split('').reduce(
      (total, digito, indice) => total + Number(digito) * (posicao + 1 - indice), 0,
    );
    const resto = (soma * 10) % 11;
    const verificador = resto === 10 ? 0 : resto;
    if (Number(cpf[posicao]) !== verificador) return false;
  }
  return true;
}

async function consultarCredencialGovBr(escritorioId: string, clienteId: string): Promise<CredencialExistente | null> {
  const administrador = criarClienteAdministrador();
  const { data, error: erro } = await administrador.from('credenciais_clientes')
    .select('id,identificacao_usuario')
    .eq('escritorio_id', escritorioId)
    .eq('cliente_id', clienteId)
    .ilike('nome_portal', NOME_PORTAL)
    .order('criado_em', { ascending: true })
    .limit(1)
    .maybeSingle();
  conferirErro(erro, 'Consultar identificação gov.br');
  return (data as CredencialExistente | null) ?? null;
}

/** Somente metadados. Nunca envia a senha ao formulário de cliente. */
export async function obterResumoAcessoGovBr(clienteId: string): Promise<ResumoAcessoGovBr | null> {
  if (!cofreGovBrConfigurado()) return null;
  const { banco, escritorioId } = await exigirEscritorio();
  const { data: cliente, error: erro } = await banco.from('clientes').select('id')
    .eq('id', clienteId).eq('escritorio_id', escritorioId).maybeSingle();
  conferirErro(erro, 'Verificar cliente');
  if (!cliente) throw new Error('Cliente não pertence ao escritório ativo.');
  const credencial = await consultarCredencialGovBr(escritorioId, clienteId);
  if (!credencial) return null;
  const cpf = digitos(credencial.identificacao_usuario ?? '');
  return { cpf: validarCpfGovBr(cpf) ? cpf : '', possuiSenha: true };
}

/** Valida e criptografa ANTES de modificar qualquer cadastro no banco. */
export async function prepararAcessoGovBr(
  dados: FormData,
  escritorioId: string,
  clienteId: string | null,
): Promise<AlteracaoAcessoGovBr | null> {
  const cpf = digitos(String(dados.get('cpf_govbr') ?? ''));
  const senha = String(dados.get('senha_govbr') ?? '');
  if (!cpf && !senha) return null;
  if (!validarCpfGovBr(cpf)) throw new Error('Informe um CPF gov.br válido (11 dígitos e verificadores corretos).');
  if (!cofreGovBrConfigurado()) throw new Error('Configure o cofre privado antes de cadastrar a credencial gov.br.');

  const existente = clienteId ? await consultarCredencialGovBr(escritorioId, clienteId) : null;
  if (!senha) {
    if (existente && digitos(existente.identificacao_usuario ?? '') === cpf) return null;
    throw new Error('Para cadastrar ou alterar o CPF gov.br, informe também a senha correspondente.');
  }
  if (senha.length > 1024) throw new Error('A senha gov.br excede o tamanho permitido.');
  return {
    cpf,
    conteudoCriptografado: criptografarCredencial(senha),
    credencialId: existente?.id ?? null,
  };
}

/** Persiste apenas o conteúdo cifrado e registra a operação sem incluir segredo em logs. */
export async function gravarAcessoGovBr(
  alteracao: AlteracaoAcessoGovBr,
  escritorioId: string,
  clienteId: string,
  usuarioId: string,
): Promise<void> {
  const administrador = criarClienteAdministrador();
  const valores = {
    identificacao_usuario: alteracao.cpf,
    conteudo_criptografado: alteracao.conteudoCriptografado,
    atualizado_em: new Date().toISOString(),
  };
  let id: string;
  let acao: 'CREATE' | 'UPDATE';
  if (alteracao.credencialId) {
    const { data, error: erro } = await administrador.from('credenciais_clientes')
      .update(valores)
      .eq('id', alteracao.credencialId)
      .eq('cliente_id', clienteId)
      .eq('escritorio_id', escritorioId)
      .select('id').single();
    conferirErro(erro, 'Atualizar acesso gov.br');
    id = data!.id;
    acao = 'UPDATE';
  } else {
    const { data, error: erro } = await administrador.from('credenciais_clientes')
      .insert({
        ...valores,
        escritorio_id: escritorioId,
        cliente_id: clienteId,
        nome_portal: NOME_PORTAL,
        criado_por: usuarioId,
      })
      .select('id').single();
    conferirErro(erro, 'Cadastrar acesso gov.br');
    id = data!.id;
    acao = 'CREATE';
  }
  const { error: erroAuditoria } = await administrador.from('historico_acessos_credenciais')
    .insert({ escritorio_id: escritorioId, credencial_id: id, usuario_id: usuarioId, acao });
  conferirErro(erroAuditoria, 'Auditar atualização da credencial gov.br');
}
