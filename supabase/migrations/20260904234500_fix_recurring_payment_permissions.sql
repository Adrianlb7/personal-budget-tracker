-- The function performs one ownership-checked, atomic operation that includes
-- metadata updates intentionally unavailable through direct table access.
alter function public.pay_recurring_commitment(uuid, date) security definer;

revoke all on function public.pay_recurring_commitment(uuid, date) from public, anon;
grant execute on function public.pay_recurring_commitment(uuid, date) to authenticated;
