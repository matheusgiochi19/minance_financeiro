create table if not exists public.recurrence_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('receita', 'despesa', 'despesa_cartao')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists recurrence_groups_user_id_idx
  on public.recurrence_groups (user_id, created_at desc);

alter table public.recurrence_groups enable row level security;

drop policy if exists "recurrence_groups_select" on public.recurrence_groups;
drop policy if exists "recurrence_groups_insert" on public.recurrence_groups;
drop policy if exists "recurrence_groups_update" on public.recurrence_groups;
drop policy if exists "recurrence_groups_delete" on public.recurrence_groups;

create policy "recurrence_groups_select"
  on public.recurrence_groups for select
  using (auth.uid() = user_id);

create policy "recurrence_groups_insert"
  on public.recurrence_groups for insert
  with check (auth.uid() = user_id);

create policy "recurrence_groups_update"
  on public.recurrence_groups for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "recurrence_groups_delete"
  on public.recurrence_groups for delete
  using (auth.uid() = user_id);

alter table public.receitas
  add column if not exists recurrence_group_id uuid null references public.recurrence_groups (id) on delete set null;

alter table public.despesas
  add column if not exists recurrence_group_id uuid null references public.recurrence_groups (id) on delete set null;

alter table public.cartao_despesas
  add column if not exists recurrence_group_id uuid null references public.recurrence_groups (id) on delete set null;

create index if not exists receitas_recurrence_group_idx
  on public.receitas (user_id, recurrence_group_id)
  where recurrence_group_id is not null;

create index if not exists despesas_recurrence_group_idx
  on public.despesas (user_id, recurrence_group_id)
  where recurrence_group_id is not null;

create index if not exists cartao_despesas_recurrence_group_idx
  on public.cartao_despesas (user_id, recurrence_group_id)
  where recurrence_group_id is not null;
