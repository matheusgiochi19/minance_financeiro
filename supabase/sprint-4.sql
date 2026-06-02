-- Minance Sprint 4
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

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_nome_not_blank check (length(trim(nome)) > 0)
);

create table if not exists public.bolsos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bolsos_nome_not_blank check (length(trim(nome)) > 0)
);

create index if not exists categorias_user_id_idx on public.categorias(user_id);
create index if not exists bolsos_user_id_idx on public.bolsos(user_id);

alter table public.categorias enable row level security;
alter table public.bolsos enable row level security;

drop trigger if exists categorias_set_updated_at on public.categorias;
create trigger categorias_set_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

drop trigger if exists bolsos_set_updated_at on public.bolsos;
create trigger bolsos_set_updated_at
before update on public.bolsos
for each row execute function public.set_updated_at();

drop policy if exists "categorias_select_own" on public.categorias;
create policy "categorias_select_own"
on public.categorias
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "categorias_insert_own" on public.categorias;
create policy "categorias_insert_own"
on public.categorias
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "categorias_update_own" on public.categorias;
create policy "categorias_update_own"
on public.categorias
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "categorias_delete_own" on public.categorias;
create policy "categorias_delete_own"
on public.categorias
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bolsos_select_own" on public.bolsos;
create policy "bolsos_select_own"
on public.bolsos
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "bolsos_insert_own" on public.bolsos;
create policy "bolsos_insert_own"
on public.bolsos
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "bolsos_update_own" on public.bolsos;
create policy "bolsos_update_own"
on public.bolsos
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "bolsos_delete_own" on public.bolsos;
create policy "bolsos_delete_own"
on public.bolsos
for delete
to authenticated
using (auth.uid() = user_id);
