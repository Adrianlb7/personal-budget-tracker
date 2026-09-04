create table public.recurring_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('subscription', 'external_installment')),
  name text not null check (char_length(name) between 1 and 120),
  account_id uuid not null,
  amount numeric(20, 6) not null check (amount > 0 and amount < 100000000000000),
  currency text not null check (currency in ('USD', 'CLP')),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  starts_on date not null,
  next_due_on date not null,
  ends_on date,
  installment_count integer,
  installments_completed integer,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, user_id),
  foreign key (account_id, user_id) references public.accounts (id, user_id) on delete restrict,
  constraint recurring_dates_check check (ends_on is null or ends_on >= starts_on),
  constraint recurring_installments_check check (
    (kind = 'subscription' and installment_count is null and installments_completed is null)
    or
    (kind = 'external_installment' and installment_count > 0 and installments_completed >= 0 and installments_completed <= installment_count)
  )
);

alter table public.recurring_commitments enable row level security;
revoke all on table public.recurring_commitments from anon, authenticated;
grant select, insert, update, delete on table public.recurring_commitments to authenticated;

create policy "Users manage their own recurring commitments"
on public.recurring_commitments for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create trigger recurring_commitments_set_updated_at
before update on public.recurring_commitments
for each row execute procedure public.set_updated_at();

create or replace function public.validate_recurring_commitment()
returns trigger language plpgsql set search_path = '' as $$
declare account_currency text;
begin
  select currency into account_currency from public.accounts
  where id = new.account_id and user_id = new.user_id and archived_at is null;
  if account_currency is null then raise exception 'Active owned account required'; end if;
  if account_currency <> new.currency then raise exception 'Commitment currency must match account currency'; end if;
  return new;
end;
$$;

create trigger recurring_commitments_validate
before insert or update on public.recurring_commitments
for each row execute procedure public.validate_recurring_commitment();

create index recurring_commitments_user_due_idx
on public.recurring_commitments (user_id, status, next_due_on);
