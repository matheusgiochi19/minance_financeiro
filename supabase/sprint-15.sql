-- Sprint 15: preferencia de tema por usuario.

alter table public.profiles
add column if not exists theme_preference text not null default 'light';

alter table public.profiles
drop constraint if exists profiles_theme_preference_check;

alter table public.profiles
add constraint profiles_theme_preference_check
check (theme_preference in ('light', 'dark'));

update public.profiles
set theme_preference = case when tema = 'dark' then 'dark' else 'light' end
where theme_preference is null
   or theme_preference not in ('light', 'dark');
