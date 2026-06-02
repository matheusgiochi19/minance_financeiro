-- Minance Sprint 5
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

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12, 2) not null,
  status text not null default 'p',
  categoria_id uuid references public.categorias(id) on delete set null,
  bolso_id uuid references public.bolsos(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  anexo_path text,
  anexo_nome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint despesas_descricao_not_blank check (length(trim(descricao)) > 0),
  constraint despesas_valor_positive check (valor > 0),
  constraint despesas_status_check check (status in ('p', 'pp', 'ab'))
);

create index if not exists despesas_user_id_idx on public.despesas(user_id);
create index if not exists despesas_categoria_id_idx on public.despesas(categoria_id);
create index if not exists despesas_bolso_id_idx on public.despesas(bolso_id);
create index if not exists despesas_created_at_idx on public.despesas(created_at);

alter table public.despesas enable row level security;

drop trigger if exists despesas_set_updated_at on public.despesas;
create trigger despesas_set_updated_at
before update on public.despesas
for each row execute function public.set_updated_at();

drop policy if exists "despesas_select_own" on public.despesas;
create policy "despesas_select_own"
on public.despesas
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "despesas_insert_own" on public.despesas;
create policy "despesas_insert_own"
on public.despesas
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "despesas_update_own" on public.despesas;
create policy "despesas_update_own"
on public.despesas
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "despesas_delete_own" on public.despesas;
create policy "despesas_delete_own"
on public.despesas
for delete
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('despesas-anexos', 'despesas-anexos', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

drop policy if exists "despesas_anexos_select_own" on storage.objects;
create policy "despesas_anexos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'despesas-anexos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "despesas_anexos_insert_own" on storage.objects;
create policy "despesas_anexos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'despesas-anexos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "despesas_anexos_update_own" on storage.objects;
create policy "despesas_anexos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'despesas-anexos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'despesas-anexos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "despesas_anexos_delete_own" on storage.objects;
create policy "despesas_anexos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'despesas-anexos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.validate_despesa_relations(
  p_categoria_id uuid,
  p_bolso_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_categoria_id is not null and not exists (
    select 1 from public.categorias
    where id = p_categoria_id and user_id = auth.uid()
  ) then
    raise exception 'Categoria inválida para este usuário.';
  end if;

  if p_bolso_id is not null and not exists (
    select 1 from public.bolsos
    where id = p_bolso_id and user_id = auth.uid()
  ) then
    raise exception 'Bolso inválido para este usuário.';
  end if;
end;
$$;

create or replace function public.create_despesa(
  p_descricao text,
  p_valor numeric,
  p_status text,
  p_categoria_id uuid,
  p_bolso_id uuid,
  p_anexo_path text,
  p_anexo_nome text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.validate_despesa_relations(p_categoria_id, p_bolso_id);

  insert into public.despesas (
    descricao,
    valor,
    status,
    categoria_id,
    bolso_id,
    user_id,
    anexo_path,
    anexo_nome
  )
  values (
    trim(p_descricao),
    p_valor,
    p_status,
    p_categoria_id,
    p_bolso_id,
    auth.uid(),
    p_anexo_path,
    p_anexo_nome
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.update_despesa(
  p_id uuid,
  p_descricao text,
  p_valor numeric,
  p_status text,
  p_categoria_id uuid,
  p_bolso_id uuid,
  p_anexo_path text,
  p_anexo_nome text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.validate_despesa_relations(p_categoria_id, p_bolso_id);

  update public.despesas
  set descricao = trim(p_descricao),
      valor = p_valor,
      status = p_status,
      categoria_id = p_categoria_id,
      bolso_id = p_bolso_id,
      anexo_path = coalesce(p_anexo_path, anexo_path),
      anexo_nome = coalesce(p_anexo_nome, anexo_nome)
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Despesa não encontrada.';
  end if;
end;
$$;

create or replace function public.mark_despesa_paid(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.despesas
  set status = 'pp'
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Despesa não encontrada.';
  end if;
end;
$$;

create or replace function public.delete_despesa(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.despesas
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Despesa não encontrada.';
  end if;
end;
$$;

grant execute on function public.create_despesa(text, numeric, text, uuid, uuid, text, text) to authenticated;
grant execute on function public.update_despesa(uuid, text, numeric, text, uuid, uuid, text, text) to authenticated;
grant execute on function public.mark_despesa_paid(uuid) to authenticated;
grant execute on function public.delete_despesa(uuid) to authenticated;
