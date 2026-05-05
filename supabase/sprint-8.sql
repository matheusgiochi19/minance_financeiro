-- Minance Sprint 8
-- Execute este script no SQL Editor do Supabase.

alter table public.profiles
add column if not exists juros_atraso numeric(5, 2) not null default 0,
add column if not exists tema text not null default 'light',
add column if not exists onboarding_hidden boolean not null default false,
add column if not exists foto_path text;

alter table public.profiles
drop constraint if exists profiles_tema_check;

alter table public.profiles
add constraint profiles_tema_check check (tema in ('light', 'dark'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('perfil-fotos', 'perfil-fotos', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

drop policy if exists "perfil_fotos_select_own" on storage.objects;
create policy "perfil_fotos_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'perfil-fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "perfil_fotos_insert_own" on storage.objects;
create policy "perfil_fotos_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'perfil-fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "perfil_fotos_update_own" on storage.objects;
create policy "perfil_fotos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'perfil-fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'perfil-fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "perfil_fotos_delete_own" on storage.objects;
create policy "perfil_fotos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'perfil-fotos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
