-- Minance Sprint 11.5
-- Execute este script no SQL Editor do Supabase.
-- Correcoes de avatar persistente e saldo consolidado.

alter table public.profiles
add column if not exists full_name text,
add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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
    - public.calcular_total_despesas(p_user_id, p_inicio, p_fim)
    - public.calcular_fatura_cartao(p_user_id, p_inicio, p_fim);
end;
$$;

grant execute on function public.calcular_saldo(uuid, date, date) to authenticated;
