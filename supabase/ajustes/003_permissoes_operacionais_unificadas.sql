-- ON ERP v0.4.1 | Permissões operacionais unificadas por escritório
-- EXECUTE APÓS o esquema inicial, a migração para português e os ajustes de Storage.
-- Aplica-se apenas a usuários autenticados e membros ATIVOS do mesmo escritório.
-- Não remove RLS, não autoriza usuário anônimo e NÃO altera permissão de gerenciar usuários.
-- Não modifica dados já cadastrados.
BEGIN;

-- A função de escrita usada pelo RLS passa a aceitar todos os membros ativos,
-- inclusive perfis antigos classificados como viewer.
CREATE OR REPLACE FUNCTION app.can_manage(p_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.membros_escritorio membro
    WHERE membro.escritorio_id = p_org
      AND membro.usuario_id = (SELECT auth.uid())
      AND membro.ativo = true
  );
$$;
REVOKE ALL ON FUNCTION app.can_manage(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.can_manage(uuid) TO authenticated;

-- Apenas políticas operacionais de exclusão, mantendo segregação entre escritórios.
-- Tabelas sensíveis/administrativas continuam com suas políticas específicas.
DO $politicas$
DECLARE tabela text;
BEGIN
  FOR tabela IN
    SELECT coluna.table_name
    FROM information_schema.columns coluna
    JOIN information_schema.tables tab
      ON tab.table_schema=coluna.table_schema AND tab.table_name=coluna.table_name
    WHERE coluna.table_schema='public' AND coluna.column_name='escritorio_id'
      AND tab.table_type='BASE TABLE'
      AND coluna.table_name NOT IN (
        'escritorios','membros_escritorio','credenciais_clientes',
        'historico_acessos_credenciais','eventos_auditoria','notificacoes'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'delete_'||tabela, tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (app.is_member(escritorio_id))',
      'delete_'||tabela, tabela
    );
  END LOOP;
END
$politicas$;

-- Documentos privados: continuar exigindo autenticação, escritório ativo e
-- vínculo do documento ao mesmo escritório, sem distinção entre perfis.
DROP POLICY IF EXISTS on_erp_arquivos_inclusao ON storage.objects;
CREATE POLICY on_erp_arquivos_inclusao ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id='on-erp-private'
  AND EXISTS (
    SELECT 1 FROM public.membros_escritorio membro
    JOIN public.clientes cliente ON cliente.escritorio_id=membro.escritorio_id
    WHERE membro.escritorio_id::text=(storage.foldername(name))[1]
      AND cliente.id::text=(storage.foldername(name))[2]
      AND membro.usuario_id=(SELECT auth.uid()) AND membro.ativo
  )
);

DROP POLICY IF EXISTS on_erp_arquivos_exclusao ON storage.objects;
CREATE POLICY on_erp_arquivos_exclusao ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id='on-erp-private'
  AND EXISTS (
    SELECT 1 FROM public.membros_escritorio membro
    JOIN public.clientes cliente ON cliente.escritorio_id=membro.escritorio_id
    WHERE membro.escritorio_id::text=(storage.foldername(name))[1]
      AND cliente.id::text=(storage.foldername(name))[2]
      AND membro.usuario_id=(SELECT auth.uid()) AND membro.ativo
  )
);

COMMIT;
