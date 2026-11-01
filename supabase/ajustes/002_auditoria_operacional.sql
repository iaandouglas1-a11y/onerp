-- ON ERP | AUDITORIA MINIMALISTA DE OPERAÇÕES CRÍTICAS
-- Migração incremental para banco já criado e renomeado.
-- Não registra conteúdos sensíveis, senhas, documentos ou valores antigos/novos.
-- Eventuais edições passam a registrar tabela, ID, operação, usuário e horário.
BEGIN;
CREATE OR REPLACE FUNCTION app.auditar_operacao_on_erp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  registro jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    registro := to_jsonb(OLD);
  ELSE
    registro := to_jsonb(NEW);
  END IF;
  INSERT INTO public.eventos_auditoria (
    escritorio_id, responsavel_id, tabela_entidade, entidade_id, acao, detalhes
  ) VALUES (
    (registro->>'escritorio_id')::uuid,
    (SELECT auth.uid()),
    TG_TABLE_NAME,
    (registro->>'id')::uuid,
    TG_OP,
    jsonb_build_object('origem','gatilho_postgresql')
  );
  RETURN COALESCE(NEW,OLD);
END;
$$;
REVOKE ALL ON FUNCTION app.auditar_operacao_on_erp() FROM PUBLIC, anon, authenticated;
DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'clientes','enderecos_clientes','contatos_clientes','representantes_clientes',
    'servicos','servicos_clientes','documentos','observacoes_clientes',
    'obrigacoes_clientes','modelos_obrigacoes','tarefas','itens_checklist_tarefas',
    'comentarios_tarefas','itens_implantacao_clientes','categorias_fiscais',
    'movimentacoes_fiscais','ajustes_faturamento_mei','regras_limites_mei'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS auditoria_on_erp ON public.%I', tabela);
    EXECUTE format('CREATE TRIGGER auditoria_on_erp AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION app.auditar_operacao_on_erp()',tabela);
  END LOOP;
END $$;
COMMIT;
