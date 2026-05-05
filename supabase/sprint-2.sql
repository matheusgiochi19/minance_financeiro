-- Minance Sprint 2
-- Execute este script no SQL Editor do Supabase.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'master');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'user',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists ativo boolean not null default true;
alter table public.profiles add column if not exists role public.app_role not null default 'user';
alter table public.profiles add column if not exists email text;
alter table public.profiles alter column email set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'blocked'
  ) then
    update public.profiles set ativo = not blocked;
  end if;
end $$;

update public.profiles
set role = 'master',
    ativo = true
where email = 'matheusgiochi@gmail.com';

alter table public.profiles enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.is_master()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'master'
      and ativo = true
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.app_role;
begin
  if not exists (select 1 from public.profiles) then
    next_role := 'master';
  else
    next_role := 'user';
  end if;

  insert into public.profiles (user_id, email, role, ativo)
  values (new.id, coalesce(new.email, ''), next_role, true)
  on conflict (user_id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "profiles_master_select_all" on public.profiles;
create policy "profiles_master_select_all"
on public.profiles
for select
to authenticated
using (public.is_master());

drop policy if exists "profiles_master_update_all" on public.profiles;
create policy "profiles_master_update_all"
on public.profiles
for update
to authenticated
using (public.is_master())
with check (public.is_master());

drop policy if exists "profiles_master_delete_all" on public.profiles;
create policy "profiles_master_delete_all"
on public.profiles
for delete
to authenticated
using (public.is_master());

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_master() then
    raise exception 'Apenas usuários master podem excluir usuários.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'O usuário master não pode excluir a própria conta por esta tela.';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;
