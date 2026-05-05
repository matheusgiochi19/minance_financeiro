-- Minance Sprint 1
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
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and role = (select role from public.profiles where user_id = auth.uid()));

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, role)
  values (new.id, coalesce(new.email, ''), 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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
      and blocked = false
  );
$$;

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

-- Depois de criar e confirmar o e-mail do usuario admin, promova-o:
-- update public.profiles set role = 'master' where email = 'SEU_EMAIL_ADMIN@dominio.com';
