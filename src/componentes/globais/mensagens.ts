/** Mensagens globais do On ERP — texto público e erros técnicos separados. */
export const MENSAGENS={
 cadastro:'Registro cadastrado com sucesso.',
 edicao:'Alterações salvas com sucesso.',
 exclusao:'Registro excluído com sucesso.',
 falhaSalvamento:'Não foi possível salvar. Confira os campos e tente novamente.',
 falhaOperacao:'Não foi possível concluir a operação. Tente novamente.',
 falhaConexao:'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
 falhaPermissao:'Você não tem permissão para realizar esta ação.',
} as const;

/** Não expõe nomes de tabelas, SQL, credenciais ou conteúdo de erros internos. */
export function mensagemErroPublica(erro:unknown,alternativa:string=MENSAGENS.falhaOperacao):string{
 const texto=erro instanceof Error?erro.message:String(erro??'');
 if(/fetch failed|network|connection|timeout|tempo limite|failed to fetch/i.test(texto))return MENSAGENS.falhaConexao;
 if(/permission denied|row.level security|not authorized|acesso negado/i.test(texto))return MENSAGENS.falhaPermissao;
 if(/duplicate key|unique constraint|already exists|já existe|duplicad/i.test(texto))return 'Já existe um registro com essas informações. Confira os dados.';
 if(/violates check constraint|foreign key|schema cache|postgres|supabase|relation |column |sqlstate|stack|\.next\//i.test(texto))return alternativa;
 return texto.length>180?alternativa:(texto.trim()||alternativa);
}
