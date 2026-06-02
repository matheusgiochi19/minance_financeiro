-- Minance Sprint 11.8
-- Execute este script no SQL Editor do Supabase.
-- Correção definitiva do bucket e policies do avatar.

alter table public.profiles
add column if not exists avatar_url text,
add column if not exists foto_path text;

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

drop policy if exists "avatars_select_own" on storage.objects;
create policy "avatars_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

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

create or replace function public.update_my_avatar(p_avatar_url text, p_foto_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, avatar_url, foto_path)
  values (auth.uid(), coalesce((auth.jwt() ->> 'email'), ''), p_avatar_url, p_foto_path)
  on conflict (user_id) do update
    set avatar_url = excluded.avatar_url,
        foto_path = excluded.foto_path,
        updated_at = now();
end;
$$;

grant execute on function public.update_my_avatar(text, text) to authenticated;
