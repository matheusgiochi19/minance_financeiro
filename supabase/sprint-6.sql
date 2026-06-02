-- Minance Sprint 6
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

create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12, 2) not null,
  categoria_id uuid references public.categorias(id) on delete set null,
  bolso_id uuid references public.bolsos(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receitas_descricao_not_blank check (length(trim(descricao)) > 0),
  constraint receitas_valor_positive check (valor > 0)
);

create table if not exists public.cartoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  limite numeric(12, 2),
  cor text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cartoes_nome_not_blank check (length(trim(nome)) > 0)
);

create table if not exists public.cartao_despesas (
  id uuid primary key default gen_random_uuid(),
  cartao_id uuid not null references public.cartoes(id) on delete cascade,
  descricao text not null,
  valor numeric(12, 2) not null,
  status text not null default 'p',
  categoria_id uuid references public.categorias(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cartao_despesas_descricao_not_blank check (length(trim(descricao)) > 0),
  constraint cartao_despesas_valor_positive check (valor > 0),
  constraint cartao_despesas_status_check check (status in ('p', 'pp', 'ab'))
);

create index if not exists receitas_user_id_idx on public.receitas(user_id);
create index if not exists cartoes_user_id_idx on public.cartoes(user_id);
create index if not exists cartao_despesas_user_id_idx on public.cartao_despesas(user_id);
create index if not exists cartao_despesas_cartao_id_idx on public.cartao_despesas(cartao_id);
create index if not exists cartao_despesas_created_at_idx on public.cartao_despesas(created_at);

alter table public.receitas enable row level security;
alter table public.cartoes enable row level security;
alter table public.cartao_despesas enable row level security;

drop trigger if exists receitas_set_updated_at on public.receitas;
create trigger receitas_set_updated_at before update on public.receitas for each row execute function public.set_updated_at();

drop trigger if exists cartoes_set_updated_at on public.cartoes;
create trigger cartoes_set_updated_at before update on public.cartoes for each row execute function public.set_updated_at();

drop trigger if exists cartao_despesas_set_updated_at on public.cartao_despesas;
create trigger cartao_despesas_set_updated_at before update on public.cartao_despesas for each row execute function public.set_updated_at();

drop policy if exists "receitas_all_own" on public.receitas;
create policy "receitas_all_own" on public.receitas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cartoes_all_own" on public.cartoes;
create policy "cartoes_all_own" on public.cartoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cartao_despesas_all_own" on public.cartao_despesas;
create policy "cartao_despesas_all_own" on public.cartao_despesas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.validate_receita_relations(p_categoria_id uuid, p_bolso_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_categoria_id is not null and not exists (select 1 from public.categorias where id = p_categoria_id and user_id = auth.uid()) then
    raise exception 'Categoria inválida para este usuário.';
  end if;
  if p_bolso_id is not null and not exists (select 1 from public.bolsos where id = p_bolso_id and user_id = auth.uid()) then
    raise exception 'Bolso inválido para este usuário.';
  end if;
end;
$$;

create or replace function public.create_receita(p_descricao text, p_valor numeric, p_categoria_id uuid, p_bolso_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform public.validate_receita_relations(p_categoria_id, p_bolso_id);
  insert into public.receitas (descricao, valor, categoria_id, bolso_id, user_id)
  values (trim(p_descricao), p_valor, p_categoria_id, p_bolso_id, auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_receita(p_id uuid, p_descricao text, p_valor numeric, p_categoria_id uuid, p_bolso_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.validate_receita_relations(p_categoria_id, p_bolso_id);
  update public.receitas set descricao = trim(p_descricao), valor = p_valor, categoria_id = p_categoria_id, bolso_id = p_bolso_id
  where id = p_id and user_id = auth.uid();
  if not found then raise exception 'Receita não encontrada.'; end if;
end;
$$;

create or replace function public.delete_receita(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.receitas where id = p_id and user_id = auth.uid();
  if not found then raise exception 'Receita não encontrada.'; end if;
end;
$$;

create or replace function public.validate_cartao_despesa_relations(p_cartao_id uuid, p_categoria_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.cartoes where id = p_cartao_id and user_id = auth.uid()) then
    raise exception 'Cartão inválido para este usuário.';
  end if;
  if p_categoria_id is not null and not exists (select 1 from public.categorias where id = p_categoria_id and user_id = auth.uid()) then
    raise exception 'Categoria inválida para este usuário.';
  end if;
end;
$$;

create or replace function public.create_cartao_despesa(p_cartao_id uuid, p_descricao text, p_valor numeric, p_status text, p_categoria_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  perform public.validate_cartao_despesa_relations(p_cartao_id, p_categoria_id);
  insert into public.cartao_despesas (cartao_id, descricao, valor, status, categoria_id, user_id)
  values (p_cartao_id, trim(p_descricao), p_valor, p_status, p_categoria_id, auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_cartao_despesa(p_id uuid, p_cartao_id uuid, p_descricao text, p_valor numeric, p_status text, p_categoria_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public.validate_cartao_despesa_relations(p_cartao_id, p_categoria_id);
  update public.cartao_despesas set descricao = trim(p_descricao), valor = p_valor, status = p_status, categoria_id = p_categoria_id
  where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid();
  if not found then raise exception 'Despesa de cartão não encontrada.'; end if;
end;
$$;

create or replace function public.delete_cartao_despesa(p_id uuid, p_cartao_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.cartao_despesas where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid();
  if not found then raise exception 'Despesa de cartão não encontrada.'; end if;
end;
$$;

create or replace function public.cartao_fatura_mes(p_cartao_id uuid, p_inicio timestamptz, p_fim timestamptz)
returns numeric language sql security definer set search_path = public stable as $$
  select coalesce(sum(valor), 0)
  from public.cartao_despesas
  where cartao_id = p_cartao_id
    and user_id = auth.uid()
    and created_at >= p_inicio
    and created_at < p_fim;
$$;

grant execute on function public.create_receita(text, numeric, uuid, uuid) to authenticated;
grant execute on function public.update_receita(uuid, text, numeric, uuid, uuid) to authenticated;
grant execute on function public.delete_receita(uuid) to authenticated;
grant execute on function public.create_cartao_despesa(uuid, text, numeric, text, uuid) to authenticated;
grant execute on function public.update_cartao_despesa(uuid, uuid, text, numeric, text, uuid) to authenticated;
grant execute on function public.delete_cartao_despesa(uuid, uuid) to authenticated;
grant execute on function public.cartao_fatura_mes(uuid, timestamptz, timestamptz) to authenticated;
