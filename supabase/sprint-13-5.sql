-- Minance Sprint 13.5
-- Execute este script no SQL Editor do Supabase.
-- Avatar privado: banco salva somente storage path; SSR gera signed URL a cada reload/login.

alter table public.profiles
add column if not exists avatar_url text,
add column if not exists foto_path text,
add column if not exists updated_at timestamptz default now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 52428800, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "profile_avatars_select_own" on storage.objects;
create policy "profile_avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_avatars_insert_own" on storage.objects;
create policy "profile_avatars_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_avatars_update_own" on storage.objects;
create policy "profile_avatars_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_avatars_delete_own" on storage.objects;
create policy "profile_avatars_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create or replace function public.save_my_avatar_path(p_avatar_path text)
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

  if p_avatar_path is null
    or p_avatar_path = ''
    or p_avatar_path like 'http%'
    or p_avatar_path like 'blob:%'
    or p_avatar_path like '%..%'
    or split_part(p_avatar_path, '/', 1) <> current_user_id::text
    or p_avatar_path !~ ('^' || current_user_id::text || '/avatar-[0-9a-f-]+-profile\.(jpg|png|webp)$') then
    raise exception 'Path de avatar invalido.';
  end if;

  update public.profiles
  set avatar_url = p_avatar_path,
      foto_path = p_avatar_path,
      updated_at = now()
  where user_id = current_user_id;

  if not found then
    insert into public.profiles (user_id, email, avatar_url, foto_path, updated_at)
    values (current_user_id, coalesce((auth.jwt() ->> 'email'), ''), p_avatar_path, p_avatar_path, now());
  end if;
end;
$$;

grant execute on function public.save_my_avatar_path(text) to authenticated;

-- Validacao apos upload:
-- select avatar_url from public.profiles where user_id = auth.uid();
-- select name from storage.objects where bucket_id = 'profile-avatars' and split_part(name, '/', 1) = auth.uid()::text;
