create or replace function public.validate_recurring_commitment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.account_id is not null or new.destination_account_id is not null then
    raise exception 'Recurring payment accounts are chosen when paid';
  end if;
  if new.currency <> 'USD' then
    raise exception 'Recurring commitments must use USD';
  end if;
  return new;
end;
$$;

update public.recurring_commitments
set account_id = null,
    destination_account_id = null,
    payment_method = 'external_expense'
where kind = 'external_installment';

drop function if exists public.pay_recurring_commitment(uuid, date, uuid);

create function public.pay_recurring_commitment(
  p_commitment_id uuid,
  p_paid_on date,
  p_account_id uuid,
  p_payment_method text default 'external_expense',
  p_destination_account_id uuid default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  commitment public.recurring_commitments%rowtype;
  source_currency text;
  destination_currency text;
  destination_type text;
  created_transaction_id uuid;
  following_due date;
  completed_count integer;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_payment_method not in ('external_expense', 'savings_reimbursement') then
    raise exception 'Unsupported payment method';
  end if;

  select * into commitment from public.recurring_commitments
  where id = p_commitment_id and user_id = owner_id and status = 'active'
  for update;
  if commitment.id is null then raise exception 'Active commitment not found'; end if;

  select currency into source_currency from public.accounts
  where id = p_account_id and user_id = owner_id and archived_at is null;
  if source_currency is null then raise exception 'Choose an active payment account'; end if;
  if source_currency <> 'USD' then raise exception 'Payment account must use USD'; end if;

  if commitment.frequency = 'weekly' then
    following_due := commitment.next_due_on + 7;
  elsif commitment.frequency = 'monthly' then
    following_due := (commitment.next_due_on + interval '1 month')::date;
  else
    following_due := (commitment.next_due_on + interval '1 year')::date;
  end if;

  if commitment.kind = 'subscription' or p_payment_method = 'external_expense' then
    select public.create_financial_transaction(
      'expense', p_paid_on, commitment.name, '', p_account_id,
      case when commitment.kind = 'subscription' then 'Subscription' else 'Installment' end,
      commitment.amount
    ) into created_transaction_id;
  else
    select currency, type into destination_currency, destination_type
    from public.accounts
    where id = p_destination_account_id and user_id = owner_id and archived_at is null;
    if destination_currency is null then raise exception 'Choose an active savings destination'; end if;
    if destination_currency <> 'USD' or destination_type <> 'savings' then
      raise exception 'Destination must be an active USD savings account';
    end if;
    if p_destination_account_id = p_account_id then
      raise exception 'Choose two different accounts';
    end if;
    select public.create_account_transfer(
      p_paid_on, commitment.name, '', p_account_id,
      p_destination_account_id, commitment.amount
    ) into created_transaction_id;
  end if;

  update public.transactions set metadata = jsonb_build_object(
    'recurring_commitment_id', commitment.id,
    'recurring_kind', case when commitment.kind = 'subscription' then 'subscription' else 'installment' end,
    'payment_method', case when commitment.kind = 'subscription' then 'external_expense' else p_payment_method end
  ) where id = created_transaction_id and user_id = owner_id;

  if commitment.kind = 'subscription' then
    update public.recurring_commitments set
      next_due_on = following_due,
      status = case when ends_on is not null and following_due > ends_on then 'completed' else status end
    where id = commitment.id;
  else
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

revoke all on function public.pay_recurring_commitment(uuid, date, uuid, text, uuid) from public, anon;
grant execute on function public.pay_recurring_commitment(uuid, date, uuid, text, uuid) to authenticated;
