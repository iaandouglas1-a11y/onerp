-- ON ERP | AJUSTE ADICIONAL (não recria tabelas já existentes)
-- Executar uma única vez no SQL Editor do projeto de desenvolvimento.
-- Bucket privado com limite de upload e políticas por escritório/cliente.
BEGIN;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('on-erp-private','on-erp-private',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','text/xml','application/xml','text/plain'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=10485760,
  allowed_mime_types=ARRAY['application/pdf','image/jpeg','image/png','text/xml','application/xml','text/plain'];

DROP POLICY IF EXISTS on_erp_arquivos_consulta ON storage.objects;
CREATE POLICY on_erp_arquivos_consulta ON storage.objects FOR SELECT TO authenticated
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
      AND membro.perfil_acesso IN ('owner','admin','accountant','analyst')
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
      AND membro.perfil_acesso IN ('owner','admin')
  )
);
COMMIT;
