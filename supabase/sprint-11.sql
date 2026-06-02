-- Minance Sprint 11
-- Execute este script no SQL Editor do Supabase.
-- Perfil do usuario, nome completo e avatar persistente.

alter table public.profiles
add column if not exists full_name text,
add column if not exists avatar_url text;

update public.profiles
set full_name = coalesce(nullif(full_name, ''), email)
where full_name is null or trim(full_name) = '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.app_role;
  new_full_name text;
begin
  if not exists (select 1 from public.profiles) then
    next_role := 'master';
  else
    next_role := 'user';
  end if;

  new_full_name := nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '');

  insert into public.profiles (user_id, email, full_name, role, ativo)
  values (new.id, coalesce(new.email, ''), coalesce(new_full_name, new.email), next_role, true)
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name);

  return new;
end;
$$;

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
