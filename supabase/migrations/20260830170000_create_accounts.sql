create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null constraint accounts_name_length check (char_length(name) between 1 and 80),
  type text not null constraint accounts_type_check
    check (type in ('cash', 'checking', 'savings', 'investment', 'credit_debt')),
  currency text not null constraint accounts_currency_check check (currency in ('USD', 'CLP')),
  opening_balance numeric(20, 6) not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

comment on table public.accounts is 'User-owned locations for assets and liabilities.';
comment on column public.accounts.opening_balance is 'Signed starting balance; liabilities are negative.';

alter table public.accounts enable row level security;
revoke all on table public.accounts from anon, authenticated;
grant select, insert, update on table public.accounts to authenticated;

create policy "Users can read their own accounts"
on public.accounts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own accounts"
on public.accounts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own accounts"
on public.accounts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute procedure public.set_updated_at();

create index accounts_user_active_idx
  on public.accounts (user_id, archived_at, created_at);

create view public.account_details
with (security_invoker = true)
as
select
  id,
  user_id,
  name,
  type,
  currency,
  opening_balance::text as opening_balance,
  archived_at,
  created_at,
  updated_at
from public.accounts;

comment on view public.account_details is 'RLS-aware account reads with exact money values serialized as text.';
revoke all on table public.account_details from anon, authenticated;
grant select on table public.account_details to authenticated;
