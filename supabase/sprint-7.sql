-- Minance Sprint 7
-- Execute este script no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  percentual_renda numeric(5, 2) not null default 0,
  valor_limite numeric(12, 2),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orcamentos_percentual_check check (percentual_renda >= 0 and percentual_renda <= 100),
  constraint orcamentos_valor_limite_check check (valor_limite is null or valor_limite > 0)
);

create unique index if not exists orcamentos_user_categoria_uidx on public.orcamentos(user_id, categoria_id);
create index if not exists orcamentos_user_id_idx on public.orcamentos(user_id);

alter table public.orcamentos enable row level security;

drop trigger if exists orcamentos_set_updated_at on public.orcamentos;
create trigger orcamentos_set_updated_at
before update on public.orcamentos
for each row execute function public.set_updated_at();

drop policy if exists "orcamentos_all_own" on public.orcamentos;
create policy "orcamentos_all_own"
on public.orcamentos
for all
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.categorias
    where categorias.id = orcamentos.categoria_id
      and categorias.user_id = auth.uid()
  )
);
