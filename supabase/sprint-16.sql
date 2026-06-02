alter table public.profiles
add column if not exists privacy_accepted boolean not null default false,
add column if not exists privacy_accepted_at timestamptz,
add column if not exists account_deleted_at timestamptz;

