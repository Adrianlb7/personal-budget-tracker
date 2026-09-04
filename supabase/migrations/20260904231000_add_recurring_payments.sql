alter table public.recurring_commitments
add column destination_account_id uuid;

alter table public.recurring_commitments
add constraint recurring_destination_account_owner_fkey
foreign key (destination_account_id, user_id)
references public.accounts (id, user_id) on delete restrict;

alter table public.recurring_commitments
drop constraint recurring_commitments_status_check;
alter table public.recurring_commitments
add constraint recurring_commitments_status_check
check (status in ('active', 'paused', 'cancelled', 'completed'));

create or replace function public.validate_recurring_commitment()
returns trigger language plpgsql set search_path = '' as $$
declare
  account_currency text;
  destination_currency text;
begin
  select currency into account_currency from public.accounts
  where id = new.account_id and user_id = new.user_id and archived_at is null;
  if account_currency is null then raise exception 'Active owned account required'; end if;
  if account_currency <> new.currency then raise exception 'Commitment currency must match account currency'; end if;

  if new.destination_account_id is not null then
    select currency into destination_currency from public.accounts
    where id = new.destination_account_id and user_id = new.user_id and archived_at is null;
    if destination_currency is null then raise exception 'Active owned destination account required'; end if;
    if destination_currency <> new.currency then raise exception 'Installment accounts must use the same currency'; end if;
    if new.destination_account_id = new.account_id then raise exception 'Installment accounts must be different'; end if;
  end if;
  return new;
end;
$$;

create or replace function public.pay_recurring_commitment(
  p_commitment_id uuid,
  p_paid_on date
) returns uuid language plpgsql set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  commitment public.recurring_commitments%rowtype;
  created_transaction_id uuid;
  following_due date;
  completed_count integer;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  select * into commitment from public.recurring_commitments
  where id = p_commitment_id and user_id = owner_id and status = 'active'
  for update;
  if commitment.id is null then raise exception 'Active commitment not found'; end if;

  if commitment.frequency = 'weekly' then
    following_due := commitment.next_due_on + 7;
  elsif commitment.frequency = 'monthly' then
    following_due := (commitment.next_due_on + interval '1 month')::date;
  else
    following_due := (commitment.next_due_on + interval '1 year')::date;
  end if;

  if commitment.kind = 'subscription' then
    select public.create_financial_transaction(
      'expense', p_paid_on, commitment.name, '', commitment.account_id,
      'Subscription', commitment.amount
    ) into created_transaction_id;
    update public.transactions set metadata = jsonb_build_object(
      'recurring_commitment_id', commitment.id,
      'recurring_kind', 'subscription'
    ) where id = created_transaction_id and user_id = owner_id;
    update public.recurring_commitments set
      next_due_on = following_due,
      status = case when ends_on is not null and following_due > ends_on then 'completed' else status end
    where id = commitment.id;
  else
    if commitment.destination_account_id is null then
      raise exception 'Installment destination account required';
    end if;
    select public.create_account_transfer(
      p_paid_on, commitment.name, '', commitment.account_id,
      commitment.destination_account_id, commitment.amount
    ) into created_transaction_id;
    update public.transactions set metadata = jsonb_build_object(
      'recurring_commitment_id', commitment.id,
      'recurring_kind', 'installment'
    ) where id = created_transaction_id and user_id = owner_id;
    completed_count := commitment.installments_completed + 1;
    update public.recurring_commitments set
      installments_completed = completed_count,
      next_due_on = following_due,
      status = case when completed_count >= installment_count then 'completed' else status end
    where id = commitment.id;
  end if;
  return created_transaction_id;
end;
$$;

revoke all on function public.pay_recurring_commitment(uuid, date) from public, anon;
grant execute on function public.pay_recurring_commitment(uuid, date) to authenticated;
