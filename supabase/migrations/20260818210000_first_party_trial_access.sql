-- First-party trials are derived from auth.users.created_at and never from Stripe.
-- Billing state is server-owned; members may read but never forge it.
drop policy if exists subscriptions_insert_own on public.subscriptions;
drop policy if exists subscriptions_update_own on public.subscriptions;
drop policy if exists subscriptions_delete_own on public.subscriptions;
drop policy if exists entitlements_insert_own on public.entitlements;
drop policy if exists entitlements_update_own on public.entitlements;
drop policy if exists entitlements_delete_own on public.entitlements;
revoke insert,update,delete on public.subscriptions from authenticated;
revoke insert,update,delete on public.entitlements from authenticated;
grant select on public.subscriptions,public.entitlements to authenticated;
alter table public.profiles alter column lifecycle_state set default 'trial';
update public.profiles p set lifecycle_state='trial',updated_at=now() where p.created_at>now()-interval '14 days' and not exists(select 1 from public.subscriptions s where s.user_id=p.user_id and s.status='active');
