-- Minance Sprint 9
-- Execute este script no SQL Editor do Supabase.
-- As funcoes PL/pgSQL rodam em uma transacao unica do PostgreSQL:
-- sucesso = COMMIT; erro/exception = ROLLBACK automatico.

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

alter table public.despesas
add column if not exists data_competencia date;

alter table public.receitas
add column if not exists data_competencia date;

alter table public.cartao_despesas
add column if not exists data_competencia date;

update public.despesas
set data_competencia = created_at::date
where data_competencia is null;

update public.receitas
set data_competencia = created_at::date
where data_competencia is null;

update public.cartao_despesas
set data_competencia = created_at::date
where data_competencia is null;

alter table public.despesas
alter column data_competencia set not null,
alter column data_competencia set default current_date;

alter table public.receitas
alter column data_competencia set not null,
alter column data_competencia set default current_date;

alter table public.cartao_despesas
alter column data_competencia set not null,
alter column data_competencia set default current_date;

create index if not exists despesas_user_competencia_idx on public.despesas(user_id, data_competencia);
create index if not exists receitas_user_competencia_idx on public.receitas(user_id, data_competencia);
create index if not exists cartao_despesas_user_competencia_idx on public.cartao_despesas(user_id, data_competencia);
create index if not exists cartao_despesas_cartao_competencia_idx on public.cartao_despesas(cartao_id, data_competencia);

create table if not exists public.auditoria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entidade text not null,
  acao text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  data timestamptz not null default now(),
  constraint auditoria_acao_check check (acao in ('create', 'update', 'delete'))
);

create index if not exists auditoria_user_data_idx on public.auditoria(user_id, data desc);
create index if not exists auditoria_entidade_data_idx on public.auditoria(entidade, data desc);

alter table public.auditoria enable row level security;

drop policy if exists "auditoria_select_own_or_master" on public.auditoria;
create policy "auditoria_select_own_or_master"
on public.auditoria
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles
    where profiles.user_id = auth.uid()
      and profiles.role = 'master'
      and profiles.ativo = true
  )
);

drop policy if exists "auditoria_insert_service" on public.auditoria;
create policy "auditoria_insert_service"
on public.auditoria
for insert
to authenticated
with check (auth.uid() = user_id);

create or replace function public.audit_table_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_user_id uuid;
  audit_action text;
begin
  audit_user_id := coalesce(new.user_id, old.user_id);
  audit_action := case tg_op
    when 'INSERT' then 'create'
    when 'UPDATE' then 'update'
    when 'DELETE' then 'delete'
  end;

  insert into public.auditoria (
    user_id,
    entidade,
    acao,
    dados_anteriores,
    dados_novos
  )
  values (
    audit_user_id,
    tg_table_name,
    audit_action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists despesas_audit on public.despesas;
create trigger despesas_audit after insert or update or delete on public.despesas for each row execute function public.audit_table_changes();

drop trigger if exists receitas_audit on public.receitas;
create trigger receitas_audit after insert or update or delete on public.receitas for each row execute function public.audit_table_changes();

drop trigger if exists cartoes_audit on public.cartoes;
create trigger cartoes_audit after insert or update or delete on public.cartoes for each row execute function public.audit_table_changes();

drop trigger if exists cartao_despesas_audit on public.cartao_despesas;
create trigger cartao_despesas_audit after insert or update or delete on public.cartao_despesas for each row execute function public.audit_table_changes();

drop trigger if exists categorias_audit on public.categorias;
create trigger categorias_audit after insert or update or delete on public.categorias for each row execute function public.audit_table_changes();

drop trigger if exists bolsos_audit on public.bolsos;
create trigger bolsos_audit after insert or update or delete on public.bolsos for each row execute function public.audit_table_changes();

drop trigger if exists orcamentos_audit on public.orcamentos;
create trigger orcamentos_audit after insert or update or delete on public.orcamentos for each row execute function public.audit_table_changes();

create or replace function public.can_read_finance(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select auth.uid() = p_user_id
    or exists (
      select 1
      from public.profiles
      where profiles.user_id = auth.uid()
        and profiles.role = 'master'
        and profiles.ativo = true
    );
$$;

create or replace function public.calcular_total_receitas(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then
    raise exception 'Acesso negado.';
  end if;

  select coalesce(sum(valor), 0)
  into total
  from public.receitas
  where user_id = p_user_id
    and data_competencia >= p_inicio
    and data_competencia < p_fim;

  return total;
end;
$$;

create or replace function public.calcular_total_despesas(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then
    raise exception 'Acesso negado.';
  end if;

  select coalesce(sum(valor), 0)
  into total
  from public.despesas
  where user_id = p_user_id
    and data_competencia >= p_inicio
    and data_competencia < p_fim;

  return total;
end;
$$;

create or replace function public.calcular_fatura_cartao(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then
    raise exception 'Acesso negado.';
  end if;

  select coalesce(sum(valor), 0)
  into total
  from public.cartao_despesas
  where user_id = p_user_id
    and data_competencia >= p_inicio
    and data_competencia < p_fim;

  return total;
end;
$$;

create or replace function public.calcular_saldo(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.can_read_finance(p_user_id) then
    raise exception 'Acesso negado.';
  end if;

  return public.calcular_total_receitas(p_user_id, p_inicio, p_fim)
    - public.calcular_total_despesas(p_user_id, p_inicio, p_fim);
end;
$$;

create or replace function public.create_despesa(
  p_descricao text,
  p_valor numeric,
  p_status text,
  p_categoria_id uuid,
  p_bolso_id uuid,
  p_anexo_path text,
  p_anexo_nome text,
  p_data_competencia date
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
    anexo_nome,
    data_competencia
  )
  values (
    trim(p_descricao),
    p_valor,
    p_status,
    p_categoria_id,
    p_bolso_id,
    auth.uid(),
    p_anexo_path,
    p_anexo_nome,
    p_data_competencia
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
  p_anexo_nome text,
  p_data_competencia date
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
      anexo_nome = coalesce(p_anexo_nome, anexo_nome),
      data_competencia = p_data_competencia
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Despesa nao encontrada.';
  end if;
end;
$$;

create or replace function public.create_receita(
  p_descricao text,
  p_valor numeric,
  p_categoria_id uuid,
  p_bolso_id uuid,
  p_data_competencia date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.validate_receita_relations(p_categoria_id, p_bolso_id);
  insert into public.receitas (descricao, valor, categoria_id, bolso_id, user_id, data_competencia)
  values (trim(p_descricao), p_valor, p_categoria_id, p_bolso_id, auth.uid(), p_data_competencia)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_receita(
  p_id uuid,
  p_descricao text,
  p_valor numeric,
  p_categoria_id uuid,
  p_bolso_id uuid,
  p_data_competencia date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.validate_receita_relations(p_categoria_id, p_bolso_id);
  update public.receitas
  set descricao = trim(p_descricao),
      valor = p_valor,
      categoria_id = p_categoria_id,
      bolso_id = p_bolso_id,
      data_competencia = p_data_competencia
  where id = p_id and user_id = auth.uid();
  if not found then raise exception 'Receita nao encontrada.'; end if;
end;
$$;

create or replace function public.create_cartao_despesa(
  p_cartao_id uuid,
  p_descricao text,
  p_valor numeric,
  p_status text,
  p_categoria_id uuid,
  p_data_competencia date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.validate_cartao_despesa_relations(p_cartao_id, p_categoria_id);
  insert into public.cartao_despesas (cartao_id, descricao, valor, status, categoria_id, user_id, data_competencia)
  values (p_cartao_id, trim(p_descricao), p_valor, p_status, p_categoria_id, auth.uid(), p_data_competencia)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_cartao_despesa(
  p_id uuid,
  p_cartao_id uuid,
  p_descricao text,
  p_valor numeric,
  p_status text,
  p_categoria_id uuid,
  p_data_competencia date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.validate_cartao_despesa_relations(p_cartao_id, p_categoria_id);
  update public.cartao_despesas
  set descricao = trim(p_descricao),
      valor = p_valor,
      status = p_status,
      categoria_id = p_categoria_id,
      data_competencia = p_data_competencia
  where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid();
  if not found then raise exception 'Despesa de cartao nao encontrada.'; end if;
end;
$$;

create or replace function public.create_cartao(p_nome text, p_limite numeric, p_cor text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.cartoes (nome, limite, cor, user_id)
  values (trim(p_nome), p_limite, p_cor, auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.update_cartao(p_id uuid, p_nome text, p_limite numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cartoes
  set nome = trim(p_nome),
      limite = p_limite
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Cartao nao encontrado.';
  end if;
end;
$$;

create or replace function public.delete_cartao(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.cartoes
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Cartao nao encontrado.';
  end if;
end;
$$;

create or replace function public.validate_orcamento_relations(p_categoria_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.categorias
    where id = p_categoria_id
      and user_id = auth.uid()
  ) then
    raise exception 'Categoria invalida para este usuario.';
  end if;
end;
$$;

create or replace function public.create_orcamento(
  p_categoria_id uuid,
  p_percentual_renda numeric,
  p_valor_limite numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  perform public.validate_orcamento_relations(p_categoria_id);

  insert into public.orcamentos (
    categoria_id,
    percentual_renda,
    valor_limite,
    user_id
  )
  values (
    p_categoria_id,
    p_percentual_renda,
    p_valor_limite,
    auth.uid()
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.update_orcamento(
  p_id uuid,
  p_categoria_id uuid,
  p_percentual_renda numeric,
  p_valor_limite numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.validate_orcamento_relations(p_categoria_id);

  update public.orcamentos
  set categoria_id = p_categoria_id,
      percentual_renda = p_percentual_renda,
      valor_limite = p_valor_limite
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Orcamento nao encontrado.';
  end if;
end;
$$;

create or replace function public.delete_orcamento(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.orcamentos
  where id = p_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Orcamento nao encontrado.';
  end if;
end;
$$;

create or replace function public.cartao_fatura_mes(p_cartao_id uuid, p_inicio date, p_fim date)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(valor), 0)
  from public.cartao_despesas
  where cartao_id = p_cartao_id
    and user_id = auth.uid()
    and data_competencia >= p_inicio
    and data_competencia < p_fim;
$$;

grant execute on function public.can_read_finance(uuid) to authenticated;
grant execute on function public.calcular_total_receitas(uuid, date, date) to authenticated;
grant execute on function public.calcular_total_despesas(uuid, date, date) to authenticated;
grant execute on function public.calcular_fatura_cartao(uuid, date, date) to authenticated;
grant execute on function public.calcular_saldo(uuid, date, date) to authenticated;
grant execute on function public.create_despesa(text, numeric, text, uuid, uuid, text, text, date) to authenticated;
grant execute on function public.update_despesa(uuid, text, numeric, text, uuid, uuid, text, text, date) to authenticated;
grant execute on function public.create_receita(text, numeric, uuid, uuid, date) to authenticated;
grant execute on function public.update_receita(uuid, text, numeric, uuid, uuid, date) to authenticated;
grant execute on function public.create_cartao_despesa(uuid, text, numeric, text, uuid, date) to authenticated;
grant execute on function public.update_cartao_despesa(uuid, uuid, text, numeric, text, uuid, date) to authenticated;
grant execute on function public.create_cartao(text, numeric, text) to authenticated;
grant execute on function public.update_cartao(uuid, text, numeric) to authenticated;
grant execute on function public.delete_cartao(uuid) to authenticated;
grant execute on function public.create_orcamento(uuid, numeric, numeric) to authenticated;
grant execute on function public.update_orcamento(uuid, uuid, numeric, numeric) to authenticated;
grant execute on function public.delete_orcamento(uuid) to authenticated;
grant execute on function public.cartao_fatura_mes(uuid, date, date) to authenticated;
