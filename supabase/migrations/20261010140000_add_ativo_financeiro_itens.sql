-- Permite arquivar contas e cartões sem apagar histórico financeiro.
alter table if exists public.financeiro_itens
  add column if not exists ativo boolean not null default true;

update public.financeiro_itens
set ativo = true
where ativo is null;
