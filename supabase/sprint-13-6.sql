-- Minance Hotfix 13.6
-- Diagnostico do pipeline de avatar.
-- Consulta para confirmar estrutura real da tabela profiles:

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;

-- Validacao apos upload:
select id, user_id, avatar_url, updated_at
from public.profiles
where user_id = auth.uid()
   or id = auth.uid();

select name, bucket_id, updated_at
from storage.objects
where bucket_id = 'profile-avatars'
  and split_part(name, '/', 1) = auth.uid()::text
order by updated_at desc;
