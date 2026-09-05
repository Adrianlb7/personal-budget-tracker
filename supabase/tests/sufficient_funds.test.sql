begin;
select plan(4);

insert into auth.users (id, email)
values ('88888888-8888-4888-8888-888888888888', 'balance-owner@example.test');
set local role postgres;
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('11111111-8888-4888-8888-888888888888', '88888888-8888-4888-8888-888888888888', 'Source', 'checking', 'USD', 1000),
  ('22222222-8888-4888-8888-888888888888', '88888888-8888-4888-8888-888888888888', 'Destination', 'savings', 'USD', 0);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"88888888-8888-4888-8888-888888888888","role":"authenticated"}', true);
select lives_ok(
  $$select public.create_account_transfer('2026-09-05', 'Full balance', '', '11111111-8888-4888-8888-888888888888', '22222222-8888-4888-8888-888888888888', 1000)$$,
  'the full available balance can be transferred'
);
select is((select current_balance from public.account_details where id = '11111111-8888-4888-8888-888888888888'), '0.000000', 'the source reaches zero');
select throws_like(
  $$select public.create_account_transfer('2026-09-05', 'Too much', '', '11111111-8888-4888-8888-888888888888', '22222222-8888-4888-8888-888888888888', 0.01)$$,
  'P0001', 'Insufficient funds:%', 'a transfer cannot overdraw its source'
);
select throws_like(
  $$select public.create_financial_transaction('expense', '2026-09-05', 'Too much', '', '11111111-8888-4888-8888-888888888888', 'Other', 0.01)$$,
  'P0001', 'Insufficient funds:%', 'an expense cannot overdraw its account'
);
select * from finish();
rollback;
