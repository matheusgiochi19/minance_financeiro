-- Minance Hotfix 13.7
-- Confirmacao de estrutura e persistencia do pipeline de avatar.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

select *
from storage.objects
where bucket_id = 'profile-avatars'
order by updated_at desc;

select avatar_url
from public.profiles
where id = auth.uid()
   or user_id = auth.uid();
