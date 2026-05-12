-- Minance Sprint 13 + Hotfix Avatar
-- Execute este script no SQL Editor do Supabase.
-- PL/pgSQL executa cada funcao em uma transacao atomica: sucesso = COMMIT, erro = ROLLBACK.

create extension if not exists pgcrypto;

-- HOTFIX AVATAR: bucket publico, URL persistente e funcao de persistencia defensiva.
alter table public.profiles
add column if not exists avatar_url text,
add column if not exists foto_path text,
add column if not exists updated_at timestamptz default now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 52428800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
on storage.objects for select to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.update_my_avatar(p_avatar_url text, p_foto_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuario autenticado obrigatorio para atualizar avatar.';
  end if;

  if p_avatar_url is null
    or p_avatar_url like 'blob:%'
    or p_avatar_url like '%localhost%'
    or p_avatar_url not like '%/storage/v1/object/public/avatars/%' then
    raise exception 'URL de avatar invalida para persistencia.';
  end if;

  if p_foto_path <> (current_user_id::text || '/avatar-profile') then
    raise exception 'Caminho do avatar invalido para o usuario autenticado.';
  end if;

  insert into public.profiles (user_id, email, avatar_url, foto_path, updated_at)
  values (current_user_id, coalesce((auth.jwt() ->> 'email'), ''), p_avatar_url, p_foto_path, now())
  on conflict (user_id) do update
    set avatar_url = excluded.avatar_url,
        foto_path = excluded.foto_path,
        updated_at = now();
end;
$$;

grant execute on function public.update_my_avatar(text, text) to authenticated;

-- INTEGRIDADE FINANCEIRA: soft delete, ledger, idempotencia e auditoria.
alter table public.despesas add column if not exists deleted_at timestamptz;
alter table public.receitas add column if not exists deleted_at timestamptz;
alter table public.cartoes add column if not exists deleted_at timestamptz;
alter table public.cartao_despesas add column if not exists deleted_at timestamptz;
alter table public.categorias add column if not exists deleted_at timestamptz;
alter table public.bolsos add column if not exists deleted_at timestamptz;

create index if not exists despesas_user_active_idx on public.despesas(user_id, data_competencia) where deleted_at is null;
create index if not exists receitas_user_active_idx on public.receitas(user_id, data_competencia) where deleted_at is null;
create index if not exists cartoes_user_active_idx on public.cartoes(user_id) where deleted_at is null;
create index if not exists cartao_despesas_user_active_idx on public.cartao_despesas(user_id, data_competencia) where deleted_at is null;
create index if not exists categorias_user_active_idx on public.categorias(user_id) where deleted_at is null;
create index if not exists bolsos_user_active_idx on public.bolsos(user_id) where deleted_at is null;

create table if not exists public.financial_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  entidade_origem text not null,
  entidade_id uuid not null,
  valor numeric(12, 2) not null,
  data_competencia date not null default current_date,
  request_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint financial_ledger_tipo_check check (tipo in ('entrada', 'saida', 'transferencia', 'ajuste')),
  constraint financial_ledger_valor_check check (valor >= 0)
);

create unique index if not exists financial_ledger_origin_uidx
on public.financial_ledger(user_id, entidade_origem, entidade_id, tipo)
where deleted_at is null;

create unique index if not exists financial_ledger_request_uidx
on public.financial_ledger(user_id, request_id)
where request_id is not null;

create index if not exists financial_ledger_user_created_idx
on public.financial_ledger(user_id, created_at desc)
where deleted_at is null;

create index if not exists financial_ledger_user_competencia_idx
on public.financial_ledger(user_id, data_competencia)
where deleted_at is null;

alter table public.financial_ledger enable row level security;

drop policy if exists "financial_ledger_select_own" on public.financial_ledger;
create policy "financial_ledger_select_own"
on public.financial_ledger for select to authenticated
using (auth.uid() = user_id);

alter table public.auditoria
add column if not exists ip inet,
add column if not exists request_id uuid;

create or replace function public.current_request_ip()
returns inet
language plpgsql
stable
as $$
declare
  headers jsonb;
  forwarded text;
begin
  headers := nullif(current_setting('request.headers', true), '')::jsonb;
  forwarded := coalesce(headers ->> 'x-forwarded-for', headers ->> 'cf-connecting-ip');
  if forwarded is null or forwarded = '' then
    return null;
  end if;
  return split_part(forwarded, ',', 1)::inet;
exception when others then
  return null;
end;
$$;

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
    when 'UPDATE' then case when (to_jsonb(old) ->> 'deleted_at') is null and (to_jsonb(new) ->> 'deleted_at') is not null then 'delete' else 'update' end
    when 'DELETE' then 'delete'
  end;

  insert into public.auditoria (user_id, entidade, acao, dados_anteriores, dados_novos, ip)
  values (
    audit_user_id,
    tg_table_name,
    audit_action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    public.current_request_ip()
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.write_ledger(
  p_user_id uuid,
  p_tipo text,
  p_entidade_origem text,
  p_entidade_id uuid,
  p_valor numeric,
  p_data_competencia date default current_date,
  p_request_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_valor < 0 then
    raise exception 'Valor de ledger invalido.';
  end if;

  update public.financial_ledger
  set deleted_at = now()
  where user_id = p_user_id
    and entidade_origem = p_entidade_origem
    and entidade_id = p_entidade_id
    and tipo = p_tipo
    and deleted_at is null;

  insert into public.financial_ledger (user_id, tipo, entidade_origem, entidade_id, valor, data_competencia, request_id)
  values (p_user_id, p_tipo, p_entidade_origem, p_entidade_id, p_valor, p_data_competencia, p_request_id);
end;
$$;

create or replace function public.cancel_ledger(p_user_id uuid, p_entidade_origem text, p_entidade_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.financial_ledger
  set deleted_at = now()
  where user_id = p_user_id
    and entidade_origem = p_entidade_origem
    and entidade_id = p_entidade_id
    and deleted_at is null;
end;
$$;

-- Recria ledger inicial a partir dos dados ativos.
truncate table public.financial_ledger;

insert into public.financial_ledger (user_id, tipo, entidade_origem, entidade_id, valor, data_competencia, created_at)
select user_id, 'entrada', 'receita', id, valor, data_competencia, created_at
from public.receitas
where deleted_at is null;

insert into public.financial_ledger (user_id, tipo, entidade_origem, entidade_id, valor, data_competencia, created_at)
select user_id, 'saida', 'despesa', id, valor, data_competencia, created_at
from public.despesas
where deleted_at is null;

insert into public.financial_ledger (user_id, tipo, entidade_origem, entidade_id, valor, data_competencia, created_at)
select user_id, 'saida', 'cartao_despesa', id, valor, data_competencia, created_at
from public.cartao_despesas
where deleted_at is null;

create or replace function public.calcular_total_receitas(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then raise exception 'Acesso negado.'; end if;
  select coalesce(sum(valor), 0) into total
  from public.receitas
  where user_id = p_user_id and deleted_at is null and data_competencia >= p_inicio and data_competencia < p_fim;
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
declare total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then raise exception 'Acesso negado.'; end if;
  select coalesce(sum(valor), 0) into total
  from public.despesas
  where user_id = p_user_id and deleted_at is null and data_competencia >= p_inicio and data_competencia < p_fim;
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
declare total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then raise exception 'Acesso negado.'; end if;
  select coalesce(sum(valor), 0) into total
  from public.cartao_despesas
  where user_id = p_user_id and deleted_at is null and data_competencia >= p_inicio and data_competencia < p_fim;
  return total;
end;
$$;

create or replace function public.calcular_saldo_ledger(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then raise exception 'Acesso negado.'; end if;
  select coalesce(sum(case when tipo = 'entrada' then valor when tipo = 'saida' then -valor else valor end), 0)
  into total
  from public.financial_ledger
  where user_id = p_user_id
    and deleted_at is null
    and data_competencia >= p_inicio
    and data_competencia < p_fim;
  return total;
end;
$$;

create or replace function public.calcular_saldo(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language sql
security definer
set search_path = public
stable
as $$
  select public.calcular_saldo_ledger(p_user_id, p_inicio, p_fim);
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
declare new_id uuid;
begin
  perform public.validate_receita_relations(p_categoria_id, p_bolso_id);
  insert into public.receitas (descricao, valor, categoria_id, bolso_id, user_id, data_competencia)
  values (trim(p_descricao), p_valor, p_categoria_id, p_bolso_id, auth.uid(), p_data_competencia)
  returning id into new_id;
  perform public.write_ledger(auth.uid(), 'entrada', 'receita', new_id, p_valor, p_data_competencia);
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
declare locked_receita public.receitas%rowtype;
begin
  select * into locked_receita from public.receitas
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Receita nao encontrada.'; end if;

  perform public.validate_receita_relations(p_categoria_id, p_bolso_id);
  update public.receitas
  set descricao = trim(p_descricao), valor = p_valor, categoria_id = p_categoria_id, bolso_id = p_bolso_id, data_competencia = p_data_competencia
  where id = p_id and user_id = auth.uid();
  perform public.write_ledger(auth.uid(), 'entrada', 'receita', p_id, p_valor, p_data_competencia);
end;
$$;

create or replace function public.delete_receita(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_receita public.receitas%rowtype;
begin
  select * into locked_receita from public.receitas
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Receita nao encontrada.'; end if;

  update public.receitas set deleted_at = now() where id = p_id and user_id = auth.uid();
  perform public.cancel_ledger(auth.uid(), 'receita', p_id);
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
declare new_id uuid;
begin
  perform public.validate_despesa_relations(p_categoria_id, p_bolso_id);
  insert into public.despesas (descricao, valor, status, categoria_id, bolso_id, user_id, anexo_path, anexo_nome, data_competencia)
  values (trim(p_descricao), p_valor, p_status, p_categoria_id, p_bolso_id, auth.uid(), p_anexo_path, p_anexo_nome, p_data_competencia)
  returning id into new_id;
  perform public.write_ledger(auth.uid(), 'saida', 'despesa', new_id, p_valor, p_data_competencia);
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
declare locked_despesa public.despesas%rowtype;
begin
  select * into locked_despesa from public.despesas
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Despesa nao encontrada.'; end if;

  perform public.validate_despesa_relations(p_categoria_id, p_bolso_id);
  update public.despesas
  set descricao = trim(p_descricao), valor = p_valor, status = p_status, categoria_id = p_categoria_id, bolso_id = p_bolso_id,
      anexo_path = coalesce(p_anexo_path, anexo_path), anexo_nome = coalesce(p_anexo_nome, anexo_nome), data_competencia = p_data_competencia
  where id = p_id and user_id = auth.uid();
  perform public.write_ledger(auth.uid(), 'saida', 'despesa', p_id, p_valor, p_data_competencia);
end;
$$;

create or replace function public.mark_despesa_paid(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_despesa public.despesas%rowtype;
begin
  select * into locked_despesa from public.despesas
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Despesa nao encontrada.'; end if;
  if locked_despesa.status = 'pp' then return; end if;

  update public.despesas set status = 'pp' where id = p_id and user_id = auth.uid();
  perform public.write_ledger(auth.uid(), 'saida', 'despesa', p_id, locked_despesa.valor, locked_despesa.data_competencia, locked_despesa.id);
end;
$$;

create or replace function public.delete_despesa(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_despesa public.despesas%rowtype;
begin
  select * into locked_despesa from public.despesas
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Despesa nao encontrada.'; end if;

  update public.despesas set deleted_at = now() where id = p_id and user_id = auth.uid();
  perform public.cancel_ledger(auth.uid(), 'despesa', p_id);
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
declare new_id uuid;
begin
  perform public.validate_cartao_despesa_relations(p_cartao_id, p_categoria_id);
  perform 1 from public.cartoes where id = p_cartao_id and user_id = auth.uid() and deleted_at is null for update;
  if not found then raise exception 'Cartao nao encontrado.'; end if;

  insert into public.cartao_despesas (cartao_id, descricao, valor, status, categoria_id, user_id, data_competencia)
  values (p_cartao_id, trim(p_descricao), p_valor, p_status, p_categoria_id, auth.uid(), p_data_competencia)
  returning id into new_id;
  perform public.write_ledger(auth.uid(), 'saida', 'cartao_despesa', new_id, p_valor, p_data_competencia);
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
declare locked_despesa public.cartao_despesas%rowtype;
begin
  select * into locked_despesa from public.cartao_despesas
  where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Despesa de cartao nao encontrada.'; end if;

  perform public.validate_cartao_despesa_relations(p_cartao_id, p_categoria_id);
  update public.cartao_despesas
  set descricao = trim(p_descricao), valor = p_valor, status = p_status, categoria_id = p_categoria_id, data_competencia = p_data_competencia
  where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid();
  perform public.write_ledger(auth.uid(), 'saida', 'cartao_despesa', p_id, p_valor, p_data_competencia);
end;
$$;

create or replace function public.delete_cartao_despesa(p_id uuid, p_cartao_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_despesa public.cartao_despesas%rowtype;
begin
  select * into locked_despesa from public.cartao_despesas
  where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Despesa de cartao nao encontrada.'; end if;

  update public.cartao_despesas set deleted_at = now() where id = p_id and cartao_id = p_cartao_id and user_id = auth.uid();
  perform public.cancel_ledger(auth.uid(), 'cartao_despesa', p_id);
end;
$$;

create or replace function public.update_cartao(p_id uuid, p_nome text, p_limite numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_cartao public.cartoes%rowtype;
begin
  select * into locked_cartao from public.cartoes
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Cartao nao encontrado.'; end if;

  update public.cartoes set nome = trim(p_nome), limite = p_limite where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.delete_cartao(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_cartao public.cartoes%rowtype;
begin
  select * into locked_cartao from public.cartoes
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Cartao nao encontrado.'; end if;

  update public.cartoes set deleted_at = now() where id = p_id and user_id = auth.uid();
  update public.cartao_despesas set deleted_at = now() where cartao_id = p_id and user_id = auth.uid() and deleted_at is null;
  update public.financial_ledger
  set deleted_at = now()
  where user_id = auth.uid()
    and entidade_origem = 'cartao_despesa'
    and entidade_id in (select id from public.cartao_despesas where cartao_id = p_id and user_id = auth.uid())
    and deleted_at is null;
end;
$$;

create or replace function public.create_categoria(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  insert into public.categorias (nome, user_id)
  values (trim(p_nome), auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_categoria(p_id uuid, p_nome text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_categoria public.categorias%rowtype;
begin
  select * into locked_categoria from public.categorias
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Categoria nao encontrada.'; end if;

  update public.categorias set nome = trim(p_nome) where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.delete_categoria(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_categoria public.categorias%rowtype;
begin
  select * into locked_categoria from public.categorias
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Categoria nao encontrada.'; end if;

  update public.categorias set deleted_at = now() where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.create_bolso(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  insert into public.bolsos (nome, user_id)
  values (trim(p_nome), auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.update_bolso(p_id uuid, p_nome text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_bolso public.bolsos%rowtype;
begin
  select * into locked_bolso from public.bolsos
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Bolso nao encontrado.'; end if;

  update public.bolsos set nome = trim(p_nome) where id = p_id and user_id = auth.uid();
end;
$$;

create or replace function public.delete_bolso(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare locked_bolso public.bolsos%rowtype;
begin
  select * into locked_bolso from public.bolsos
  where id = p_id and user_id = auth.uid() and deleted_at is null
  for update;
  if not found then raise exception 'Bolso nao encontrado.'; end if;

  update public.bolsos set deleted_at = now() where id = p_id and user_id = auth.uid();
end;
$$;

grant execute on function public.calcular_saldo_ledger(uuid, date, date) to authenticated;
grant execute on function public.calcular_saldo(uuid, date, date) to authenticated;
grant execute on function public.calcular_total_receitas(uuid, date, date) to authenticated;
grant execute on function public.calcular_total_despesas(uuid, date, date) to authenticated;
grant execute on function public.calcular_fatura_cartao(uuid, date, date) to authenticated;
grant execute on function public.create_receita(text, numeric, uuid, uuid, date) to authenticated;
grant execute on function public.update_receita(uuid, text, numeric, uuid, uuid, date) to authenticated;
grant execute on function public.delete_receita(uuid) to authenticated;
grant execute on function public.create_despesa(text, numeric, text, uuid, uuid, text, text, date) to authenticated;
grant execute on function public.update_despesa(uuid, text, numeric, text, uuid, uuid, text, text, date) to authenticated;
grant execute on function public.mark_despesa_paid(uuid) to authenticated;
grant execute on function public.delete_despesa(uuid) to authenticated;
grant execute on function public.create_cartao_despesa(uuid, text, numeric, text, uuid, date) to authenticated;
grant execute on function public.update_cartao_despesa(uuid, uuid, text, numeric, text, uuid, date) to authenticated;
grant execute on function public.delete_cartao_despesa(uuid, uuid) to authenticated;
grant execute on function public.update_cartao(uuid, text, numeric) to authenticated;
grant execute on function public.delete_cartao(uuid) to authenticated;
grant execute on function public.create_categoria(text) to authenticated;
grant execute on function public.update_categoria(uuid, text) to authenticated;
grant execute on function public.delete_categoria(uuid) to authenticated;
grant execute on function public.create_bolso(text) to authenticated;
grant execute on function public.update_bolso(uuid, text) to authenticated;
grant execute on function public.delete_bolso(uuid) to authenticated;

-- Queries de validacao manual apos upload:
-- select user_id, avatar_url, foto_path, updated_at from public.profiles where user_id = auth.uid();
-- select name, bucket_id, updated_at from storage.objects where bucket_id = 'avatars' and name = auth.uid()::text || '/avatar-profile';
