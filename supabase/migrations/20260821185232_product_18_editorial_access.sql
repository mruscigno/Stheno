create table if not exists public.editorial_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by text not null default 'product_18_owner_bootstrap'
);
alter table public.editorial_admins enable row level security;
revoke all on table public.editorial_admins from anon, authenticated;
insert into public.editorial_admins(user_id)
select id from auth.users where lower(email)=lower('matthewruscigno@gmail.com')
on conflict(user_id) do nothing;
