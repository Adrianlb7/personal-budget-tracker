drop view if exists public.account_details;

alter table public.accounts drop constraint if exists accounts_currency_check;
alter table public.accounts alter column opening_balance type numeric(24, 8);
alter table public.accounts add constraint accounts_currency_check check (currency in ('USD', 'CLP', 'BTC'));

create view public.account_details with (security_invoker = true) as
select
  a.id, a.user_id, a.name, a.type, a.currency,
  a.opening_balance::text as opening_balance,
  a.archived_at, a.created_at, a.updated_at,
  (a.opening_balance + coalesce(sum(
    case when l.direction = 'inflow' then l.amount else -l.amount end
  ), 0))::text as current_balance
from public.accounts a
left join public.transaction_lines l on l.account_id = a.id and l.user_id = a.user_id
group by a.id;

comment on view public.account_details is 'RLS-aware account reads with exact money values serialized as text.';
revoke all on table public.account_details from anon, authenticated;
grant select on table public.account_details to authenticated;

create or replace function public.enforce_supported_account_movement()
returns trigger language plpgsql set search_path = '' as $$
declare account_currency text; transaction_type text;
begin
  select currency into account_currency from public.accounts where id = new.account_id and user_id = new.user_id;
  select type into transaction_type from public.transactions where id = new.transaction_id and user_id = new.user_id;
  if account_currency = 'BTC' then raise exception 'Bitcoin accounts are holding-only'; end if;
  if transaction_type in ('income', 'expense') and account_currency <> 'USD' then raise exception 'Income and expenses require a USD account'; end if;
  return new;
end; $$;
drop trigger if exists transaction_lines_supported_currency on public.transaction_lines;
create trigger transaction_lines_supported_currency before insert on public.transaction_lines
for each row execute procedure public.enforce_supported_account_movement();

create or replace function public.create_clp_usd_transfer(p_date date, p_description text, p_notes text, p_source_account_id uuid, p_destination_account_id uuid, p_clp_amount numeric, p_clp_per_usd numeric)
returns uuid language plpgsql set search_path = '' as $$
declare owner_id uuid := auth.uid(); transaction_id uuid; usd_amount numeric;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_source_account_id = p_destination_account_id then raise exception 'Transfer accounts must be different'; end if;
  if p_clp_amount <= 0 or scale(p_clp_amount) > 6 or p_clp_amount >= 100000000000000 then raise exception 'Invalid CLP amount'; end if;
  if p_clp_per_usd <= 0 or scale(p_clp_per_usd) > 6 or p_clp_per_usd >= 100000000 then raise exception 'Invalid bank rate'; end if;
  if not exists (select 1 from public.accounts where id = p_source_account_id and user_id = owner_id and archived_at is null and currency = 'CLP') then raise exception 'Source must be an active CLP account'; end if;
  if not exists (select 1 from public.accounts where id = p_destination_account_id and user_id = owner_id and archived_at is null and currency = 'USD' and type = 'checking') then raise exception 'Destination must be an active USD checking account'; end if;
  usd_amount := round(p_clp_amount / p_clp_per_usd, 6);
  if usd_amount <= 0 then raise exception 'Converted amount is too small'; end if;
  insert into public.transactions (user_id, type, date, description, notes, metadata)
  values (owner_id, 'transfer', p_date, trim(p_description), nullif(trim(p_notes), ''), jsonb_build_object('fx_pair', 'CLP/USD', 'clp_per_usd', p_clp_per_usd, 'fx_source', 'manual_bank_rate')) returning id into transaction_id;
  insert into public.transaction_lines (transaction_id, user_id, account_id, direction, amount, currency, fx_rate_to_base, fx_rate_source, fx_rate_date) values
    (transaction_id, owner_id, p_source_account_id, 'outflow', p_clp_amount, 'CLP', p_clp_per_usd, 'manual_bank_rate', p_date),
    (transaction_id, owner_id, p_destination_account_id, 'inflow', usd_amount, 'USD', 1, 'manual_bank_rate', p_date);
  return transaction_id;
end; $$;
revoke all on function public.create_clp_usd_transfer(date, text, text, uuid, uuid, numeric, numeric) from public, anon;
grant execute on function public.create_clp_usd_transfer(date, text, text, uuid, uuid, numeric, numeric) to authenticated;
