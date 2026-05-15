insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  52428800,
  array[
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
)
on conflict (id) do nothing;

drop policy if exists "avatar_select_own" on storage.objects;
create policy "avatar_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists "avatar_delete_own" on storage.objects;
create policy "avatar_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = split_part(name, '/', 1)
);
