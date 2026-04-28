create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nome_completo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.configuracoes_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  moeda text not null default 'BRL',
  idioma text not null default 'pt-BR',
  fuso_horario text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nome text not null,
  tipo text not null default 'despesa' check (tipo in ('receita', 'despesa', 'ambos')),
  cor text not null default '#A35139',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists categorias_user_nome_idx
  on public.categorias (user_id, lower(nome));

create table if not exists public.bolsos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nome text not null,
  saldo_inicial numeric(12, 2) not null default 0,
  cor text not null default '#455564',
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists bolsos_user_nome_idx
  on public.bolsos (user_id, lower(nome));

create table if not exists public.cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nome text not null,
  bandeira text,
  limite numeric(12, 2),
  dia_fechamento smallint,
  dia_vencimento smallint,
  cor text not null default '#FFBC78',
  ativo boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cartoes_user_nome_idx
  on public.cartoes (user_id, lower(nome));

create table if not exists public.receitas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  bolso_id uuid references public.bolsos (id) on delete set null,
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  data_recebimento date not null,
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists receitas_user_data_idx
  on public.receitas (user_id, data_recebimento desc);

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  bolso_id uuid references public.bolsos (id) on delete set null,
  cartao_id uuid references public.cartoes (id) on delete set null,
  status text not null default 'pendente' check (status in ('pendente', 'paga')),
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  data_despesa date not null,
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists despesas_user_data_idx
  on public.despesas (user_id, data_despesa desc);

create table if not exists public.despesas_cartao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  despesa_id uuid not null unique references public.despesas (id) on delete cascade,
  cartao_id uuid not null references public.cartoes (id) on delete cascade,
  competencia text not null,
  parcela_atual integer,
  parcelas_totais integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  categoria_id uuid references public.categorias (id) on delete set null,
  bolso_id uuid references public.bolsos (id) on delete set null,
  mes_referencia date not null,
  valor_limite numeric(12, 2) not null check (valor_limite >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists orcamentos_user_mes_categoria_bolso_idx
  on public.orcamentos (user_id, mes_referencia, categoria_id, bolso_id);

create table if not exists public.anexos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  despesa_id uuid references public.despesas (id) on delete cascade,
  receita_id uuid references public.receitas (id) on delete cascade,
  nome_arquivo text not null,
  caminho_storage text not null,
  mime_type text,
  tamanho_bytes bigint,
  created_at timestamptz not null default timezone('utc', now()),
  constraint anexos_vinculo_check check (
    (despesa_id is not null and receita_id is null)
    or (despesa_id is null and receita_id is not null)
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, nome_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do update
  set email = excluded.email,
      nome_completo = excluded.nome_completo,
      updated_at = timezone('utc', now());

  insert into public.configuracoes_usuario (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.bolsos (user_id, nome, saldo_inicial, cor)
  values (new.id, 'Conta principal', 0, '#455564')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.configuracoes_usuario enable row level security;
alter table public.categorias enable row level security;
alter table public.bolsos enable row level security;
alter table public.cartoes enable row level security;
alter table public.receitas enable row level security;
alter table public.despesas enable row level security;
alter table public.despesas_cartao enable row level security;
alter table public.orcamentos enable row level security;
alter table public.anexos enable row level security;

create or replace function public.create_user_owned_policies(target_table text)
returns void
language plpgsql
as $$
begin
  execute format('drop policy if exists "%1$s_select" on public.%1$s', target_table);
  execute format('drop policy if exists "%1$s_insert" on public.%1$s', target_table);
  execute format('drop policy if exists "%1$s_update" on public.%1$s', target_table);
  execute format('drop policy if exists "%1$s_delete" on public.%1$s', target_table);

  execute format(
    'create policy "%1$s_select" on public.%1$s for select using (auth.uid() = user_id)',
    target_table
  );
  execute format(
    'create policy "%1$s_insert" on public.%1$s for insert with check (auth.uid() = user_id)',
    target_table
  );
  execute format(
    'create policy "%1$s_update" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
    target_table
  );
  execute format(
    'create policy "%1$s_delete" on public.%1$s for delete using (auth.uid() = user_id)',
    target_table
  );
end;
$$;

select public.create_user_owned_policies('configuracoes_usuario');
select public.create_user_owned_policies('categorias');
select public.create_user_owned_policies('bolsos');
select public.create_user_owned_policies('cartoes');
select public.create_user_owned_policies('receitas');
select public.create_user_owned_policies('despesas');
select public.create_user_owned_policies('despesas_cartao');
select public.create_user_owned_policies('orcamentos');
select public.create_user_owned_policies('anexos');

drop policy if exists "users_select" on public.users;
drop policy if exists "users_update" on public.users;
create policy "users_select"
  on public.users for select
  using (auth.uid() = id);
create policy "users_update"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

