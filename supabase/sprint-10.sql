-- Minance Sprint 10
-- Execute este script no SQL Editor do Supabase.
-- Indices voltados para filtros mensais, busca, paginacao e joins recorrentes.

create extension if not exists pg_trgm;

create index if not exists despesas_user_comp_status_idx
on public.despesas(user_id, data_competencia desc, status);

create index if not exists despesas_user_comp_categoria_idx
on public.despesas(user_id, data_competencia desc, categoria_id);

create index if not exists despesas_user_comp_bolso_idx
on public.despesas(user_id, data_competencia desc, bolso_id);

create index if not exists despesas_descricao_trgm_idx
on public.despesas using gin (descricao gin_trgm_ops);

create index if not exists receitas_user_comp_categoria_idx
on public.receitas(user_id, data_competencia desc, categoria_id);

create index if not exists receitas_user_comp_bolso_idx
on public.receitas(user_id, data_competencia desc, bolso_id);

create index if not exists receitas_descricao_trgm_idx
on public.receitas using gin (descricao gin_trgm_ops);

create index if not exists cartoes_user_created_idx
on public.cartoes(user_id, created_at desc);

create index if not exists cartao_despesas_user_cartao_comp_idx
on public.cartao_despesas(user_id, cartao_id, data_competencia desc);

create index if not exists auditoria_user_entidade_data_idx
on public.auditoria(user_id, entidade, data desc);
