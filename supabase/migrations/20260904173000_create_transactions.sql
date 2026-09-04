create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null constraint categories_name_length check (char_length(name) between 1 and 80),
  kind text not null constraint categories_kind_check check (kind in ('income', 'expense')),
  parent_category_id uuid,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  unique (user_id, kind, name),
  foreign key (parent_category_id, user_id) references public.categories (id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null constraint transactions_type_check check (type in ('income', 'expense')),
  date date not null,
  description text not null constraint transactions_description_length check (char_length(description) between 1 and 160),
  notes text constraint transactions_notes_length check (char_length(notes) <= 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id)
);

create table public.transaction_lines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null,
  category_id uuid,
  direction text not null constraint transaction_lines_direction_check check (direction in ('inflow', 'outflow')),
  amount numeric(20, 6) not null constraint transaction_lines_positive_amount check (amount > 0),
  currency text not null constraint transaction_lines_currency_check check (currency in ('USD', 'CLP')),
  fx_rate_to_base numeric(24, 12),
  fx_rate_source text,
  fx_rate_date date,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (transaction_id, user_id) references public.transactions (id, user_id) on delete restrict,
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete restrict,
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete restrict
);

alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_lines enable row level security;

revoke all on table public.categories, public.transactions, public.transaction_lines from anon, authenticated;
grant select, insert, update on table public.categories to authenticated;
grant select, insert on table public.transactions, public.transaction_lines to authenticated;

create policy "Users manage their own categories" on public.categories
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users read their own transactions" on public.transactions
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create their own transactions" on public.transactions
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users read their own transaction lines" on public.transaction_lines
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users create their own transaction lines" on public.transaction_lines
for insert to authenticated with check ((select auth.uid()) = user_id);

create trigger categories_set_updated_at before update on public.categories
for each row execute procedure public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
for each row execute procedure public.set_updated_at();

create or replace function public.validate_transaction_line()
returns trigger language plpgsql set search_path = '' as $$
declare
  transaction_type text;
  category_kind text;
  account_currency text;
begin
  select type into transaction_type from public.transactions
    where id = new.transaction_id and user_id = new.user_id;
  select kind into category_kind from public.categories
    where id = new.category_id and user_id = new.user_id;
  select currency into account_currency from public.accounts
    where id = new.account_id and user_id = new.user_id and archived_at is null;

  if transaction_type is null or category_kind is null or account_currency is null then
    raise exception 'Transaction line references an unavailable owned record';
  end if;
  if transaction_type <> category_kind then
    raise exception 'Category kind must match transaction type';
  end if;
  if (transaction_type = 'income' and new.direction <> 'inflow')
    or (transaction_type = 'expense' and new.direction <> 'outflow') then
    raise exception 'Transaction direction does not match transaction type';
  end if;
  if new.currency <> account_currency then
    raise exception 'Transaction currency must match account currency';
  end if;
  return new;
end;
$$;

create trigger transaction_lines_validate before insert on public.transaction_lines
for each row execute procedure public.validate_transaction_line();

create or replace function public.create_financial_transaction(
  p_type text,
  p_date date,
  p_description text,
  p_notes text,
  p_account_id uuid,
  p_category_name text,
  p_amount numeric
) returns uuid language plpgsql set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  category_id uuid;
  transaction_id uuid;
  account_currency text;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_type not in ('income', 'expense') then raise exception 'Invalid transaction type'; end if;
  if p_amount <= 0 or scale(p_amount) > 6 or p_amount >= 100000000000000 then
    raise exception 'Invalid transaction amount';
  end if;

  select currency into account_currency from public.accounts
    where id = p_account_id and user_id = owner_id and archived_at is null;
  if account_currency is null then raise exception 'Account not found'; end if;

  insert into public.categories (user_id, name, kind)
  values (owner_id, trim(p_category_name), p_type)
  on conflict (user_id, kind, name) do update set name = excluded.name
  returning id into category_id;

  insert into public.transactions (user_id, type, date, description, notes)
  values (owner_id, p_type, p_date, trim(p_description), nullif(trim(p_notes), ''))
  returning id into transaction_id;

  insert into public.transaction_lines (
    transaction_id, user_id, account_id, category_id, direction, amount, currency
  ) values (
    transaction_id, owner_id, p_account_id, category_id,
    case when p_type = 'income' then 'inflow' else 'outflow' end,
    p_amount, account_currency
  );
  return transaction_id;
end;
$$;

revoke all on function public.create_financial_transaction(text, date, text, text, uuid, text, numeric) from public, anon;
grant execute on function public.create_financial_transaction(text, date, text, text, uuid, text, numeric) to authenticated;

create view public.transaction_details with (security_invoker = true) as
select
  t.id, t.user_id, t.type, t.date, t.description, t.notes, t.metadata, t.created_at,
  l.account_id, a.name as account_name, l.category_id, c.name as category_name,
  l.direction, l.amount::text as amount, l.currency
from public.transactions t
join public.transaction_lines l on l.transaction_id = t.id and l.user_id = t.user_id
join public.accounts a on a.id = l.account_id and a.user_id = l.user_id
join public.categories c on c.id = l.category_id and c.user_id = l.user_id;

revoke all on table public.transaction_details from anon, authenticated;
grant select on table public.transaction_details to authenticated;

create or replace view public.account_details with (security_invoker = true) as
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

revoke all on table public.account_details from anon, authenticated;
grant select on table public.account_details to authenticated;

create index categories_user_kind_idx on public.categories (user_id, kind, archived_at, name);
create index transactions_user_date_idx on public.transactions (user_id, date desc, created_at desc);
create index transaction_lines_account_idx on public.transaction_lines (user_id, account_id);
