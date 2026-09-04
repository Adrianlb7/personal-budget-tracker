begin;

select plan(12);

insert into auth.users (id, email)
values
  ('77777777-7777-4777-8777-777777777777', 'recurring-owner@example.test'),
  ('88888888-8888-4888-8888-888888888888', 'recurring-other@example.test');

set local role postgres;
insert into public.accounts (id, user_id, name, type, currency, opening_balance)
values
  ('11111111-1111-4111-8111-111111111111', '77777777-7777-4777-8777-777777777777', 'Checking', 'checking', 'USD', 1000),
  ('22222222-2222-4222-8222-222222222222', '77777777-7777-4777-8777-777777777777', 'Savings', 'savings', 'USD', 500),
  ('33333333-3333-4333-8333-333333333333', '88888888-8888-4888-8888-888888888888', 'Other', 'checking', 'USD', 1000);

set local role anon;
select throws_ok(
  $$select * from public.recurring_commitments$$,
  '42501',
  null,
  'anon cannot read recurring commitments'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.recurring_commitments (
    id, user_id, kind, name, account_id, amount, currency, frequency,
    starts_on, next_due_on, status, payment_method
  ) values (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '77777777-7777-4777-8777-777777777777',
    'subscription', 'Cloud', '11111111-1111-4111-8111-111111111111',
    20, 'USD', 'monthly', '2026-09-01', '2026-09-04', 'active',
    'external_expense'
  )$$,
  'an owner can create a subscription'
);
select throws_ok(
  $$insert into public.recurring_commitments (
    user_id, kind, name, account_id, amount, currency, frequency,
    starts_on, next_due_on, status, payment_method
  ) values (
    '88888888-8888-4888-8888-888888888888',
    'subscription', 'Not mine', '33333333-3333-4333-8333-333333333333',
    20, 'USD', 'monthly', '2026-09-01', '2026-09-04', 'active',
    'external_expense'
  )$$,
  '42501',
  null,
  'a user cannot create a commitment for someone else'
);
select is((select count(*)::integer from public.recurring_commitments), 1, 'another user commitments are invisible');

select lives_ok(
  $$select public.pay_recurring_commitment('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2026-09-04')$$,
  'a subscription can be paid'
);
select is((select type from public.transactions limit 1), 'expense', 'a subscription payment is an expense');
select is((select category_name from public.transaction_details limit 1), 'Subscription', 'a subscription is categorized automatically');
select is((select next_due_on::text from public.recurring_commitments where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), '2026-10-04', 'paying advances the due date');

insert into public.recurring_commitments (
  id, user_id, kind, name, account_id, destination_account_id, amount,
  currency, frequency, starts_on, next_due_on, installment_count,
  installments_completed, status, payment_method
) values (
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '77777777-7777-4777-8777-777777777777',
  'external_installment', 'Laptop', '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222', 100, 'USD', 'monthly',
  '2026-09-01', '2026-09-04', 1, 0, 'active', 'savings_reimbursement'
);
select lives_ok(
  $$select public.pay_recurring_commitment('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2026-09-04')$$,
  'a savings reimbursement installment can be paid'
);
select is((select type from public.transactions where description = 'Laptop'), 'transfer', 'a reimbursement is an internal transfer');
select is((select status from public.recurring_commitments where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 'completed', 'the final installment completes the commitment');
select is((select current_balance from public.account_details where id = '22222222-2222-4222-8222-222222222222'), '600.000000', 'a reimbursement replenishes savings');

select * from finish();
rollback;
