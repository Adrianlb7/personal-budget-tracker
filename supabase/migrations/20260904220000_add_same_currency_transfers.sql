alter table public.transactions drop constraint transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('income', 'expense', 'transfer'));

create or replace function public.validate_transaction_line()
returns trigger language plpgsql set search_path = '' as $$
declare
  transaction_type text;
  category_kind text;
  account_currency text;
begin
  select type into transaction_type from public.transactions
    where id = new.transaction_id and user_id = new.user_id;
  select currency into account_currency from public.accounts
    where id = new.account_id and user_id = new.user_id and archived_at is null;

  if transaction_type is null or account_currency is null then
    raise exception 'Transaction line references an unavailable owned record';
  end if;
  if transaction_type = 'transfer' then
    if new.category_id is not null then
      raise exception 'Transfers cannot have a category';
    end if;
  else
    select kind into category_kind from public.categories
      where id = new.category_id and user_id = new.user_id;
    if category_kind is null or transaction_type <> category_kind then
      raise exception 'Category kind must match transaction type';
    end if;
    if (transaction_type = 'income' and new.direction <> 'inflow')
      or (transaction_type = 'expense' and new.direction <> 'outflow') then
      raise exception 'Transaction direction does not match transaction type';
    end if;
  end if;
  if new.currency <> account_currency then
    raise exception 'Transaction currency must match account currency';
  end if;
  return new;
end;
$$;

create or replace function public.create_account_transfer(
  p_date date,
  p_description text,
  p_notes text,
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_amount numeric
) returns uuid language plpgsql set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  transaction_id uuid;
  source_currency text;
  destination_currency text;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_source_account_id = p_destination_account_id then
    raise exception 'Transfer accounts must be different';
  end if;
  if p_amount <= 0 or scale(p_amount) > 6 or p_amount >= 100000000000000 then
    raise exception 'Invalid transfer amount';
  end if;

  select currency into source_currency from public.accounts
    where id = p_source_account_id and user_id = owner_id and archived_at is null;
  select currency into destination_currency from public.accounts
    where id = p_destination_account_id and user_id = owner_id and archived_at is null;
  if source_currency is null or destination_currency is null then
    raise exception 'Transfer account not found';
  end if;
  if source_currency <> destination_currency then
    raise exception 'Cross-currency transfers are not supported yet';
  end if;

  insert into public.transactions (user_id, type, date, description, notes)
  values (owner_id, 'transfer', p_date, trim(p_description), nullif(trim(p_notes), ''))
  returning id into transaction_id;

  insert into public.transaction_lines (
    transaction_id, user_id, account_id, direction, amount, currency
  ) values
    (transaction_id, owner_id, p_source_account_id, 'outflow', p_amount, source_currency),
    (transaction_id, owner_id, p_destination_account_id, 'inflow', p_amount, destination_currency);

  return transaction_id;
end;
$$;

revoke all on function public.create_account_transfer(date, text, text, uuid, uuid, numeric) from public, anon;
grant execute on function public.create_account_transfer(date, text, text, uuid, uuid, numeric) to authenticated;

create or replace view public.transaction_details with (security_invoker = true) as
select
  t.id, t.user_id, t.type, t.date, t.description, t.notes, t.metadata, t.created_at,
  (array_agg(l.account_id) filter (where l.direction = 'outflow' or t.type = 'income'))[1] as account_id,
  max(a.name) filter (where l.direction = 'outflow' or t.type = 'income') as account_name,
  (array_agg(l.category_id) filter (where l.category_id is not null))[1] as category_id,
  max(c.name) as category_name,
  case when t.type = 'income' then 'inflow' else 'outflow' end as direction,
  (max(l.amount) filter (where l.direction = 'outflow' or t.type = 'income'))::text as amount,
  max(l.currency) filter (where l.direction = 'outflow' or t.type = 'income') as currency,
  (array_agg(l.account_id) filter (where t.type = 'transfer' and l.direction = 'inflow'))[1] as destination_account_id,
  max(a.name) filter (where t.type = 'transfer' and l.direction = 'inflow') as destination_account_name,
  (max(l.amount) filter (where t.type = 'transfer' and l.direction = 'inflow'))::text as destination_amount,
  max(l.currency) filter (where t.type = 'transfer' and l.direction = 'inflow') as destination_currency
from public.transactions t
join public.transaction_lines l on l.transaction_id = t.id and l.user_id = t.user_id
join public.accounts a on a.id = l.account_id and a.user_id = l.user_id
left join public.categories c on c.id = l.category_id and c.user_id = l.user_id
group by t.id;

revoke all on table public.transaction_details from anon, authenticated;
grant select on table public.transaction_details to authenticated;
