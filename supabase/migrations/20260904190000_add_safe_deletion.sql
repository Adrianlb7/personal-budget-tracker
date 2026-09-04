create or replace function public.delete_financial_transaction(p_transaction_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.transactions where id = p_transaction_id and user_id = owner_id) then return false; end if;
  delete from public.transaction_lines where transaction_id = p_transaction_id and user_id = owner_id;
  delete from public.transactions where id = p_transaction_id and user_id = owner_id;
  return true;
end;
$$;

create or replace function public.delete_empty_account(p_account_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.accounts where id = p_account_id and user_id = owner_id) then return false; end if;
  if exists (select 1 from public.transaction_lines where account_id = p_account_id and user_id = owner_id) then
    raise exception 'Accounts with transaction history cannot be deleted';
  end if;
  delete from public.accounts where id = p_account_id and user_id = owner_id;
  return true;
end;
$$;

revoke all on function public.delete_financial_transaction(uuid) from public, anon;
revoke all on function public.delete_empty_account(uuid) from public, anon;
grant execute on function public.delete_financial_transaction(uuid) to authenticated;
grant execute on function public.delete_empty_account(uuid) to authenticated;
