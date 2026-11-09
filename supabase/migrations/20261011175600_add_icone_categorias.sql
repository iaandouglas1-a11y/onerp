-- Permite que cada categoria mantenha o ícone escolhido pelo usuário.
alter table if exists public.categorias
  add column if not exists icone text;
