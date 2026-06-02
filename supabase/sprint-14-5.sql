-- Sprint 14.5: remove completamente a estrutura persistente de avatar.

drop function if exists public.save_my_avatar_path(text);
drop function if exists public.update_my_avatar(text, text);

alter table public.profiles
drop column if exists avatar_url,
drop column if exists foto_path;

delete from storage.objects
where bucket_id in ('profile-avatars', 'avatars');

delete from storage.buckets
where id in ('profile-avatars', 'avatars');
