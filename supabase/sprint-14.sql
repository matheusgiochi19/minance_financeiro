create unique index if not exists categorias_user_nome_active_uidx
on public.categorias (user_id, lower(trim(nome)))
where deleted_at is null;

create unique index if not exists bolsos_user_nome_active_uidx
on public.bolsos (user_id, lower(trim(nome)))
where deleted_at is null;

create or replace function public.calcular_fatura_cartao(p_user_id uuid, p_inicio date, p_fim date)
returns numeric
language plpgsql
security definer
set search_path = public
stable
as $$
declare total numeric(12, 2);
begin
  if not public.can_read_finance(p_user_id) then
    raise exception 'Acesso negado.';
  end if;

  select coalesce(sum(valor), 0)
  into total
  from public.cartao_despesas
  where user_id = p_user_id
    and deleted_at is null
    and status <> 'pp'
    and data_competencia >= p_inicio
    and data_competencia < p_fim;

  return total;
end;
$$;

create or replace function public.create_categoria(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  new_id uuid;
begin
  select id
  into existing_id
  from public.categorias
  where user_id = auth.uid()
    and deleted_at is null
    and lower(trim(nome)) = lower(trim(p_nome))
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.categorias (nome, user_id)
  values (trim(p_nome), auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.create_bolso(p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid;
  new_id uuid;
begin
  select id
  into existing_id
  from public.bolsos
  where user_id = auth.uid()
    and deleted_at is null
    and lower(trim(nome)) = lower(trim(p_nome))
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  insert into public.bolsos (nome, user_id)
  values (trim(p_nome), auth.uid())
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.calcular_fatura_cartao(uuid, date, date) to authenticated;
grant execute on function public.create_categoria(text) to authenticated;
grant execute on function public.create_bolso(text) to authenticated;
