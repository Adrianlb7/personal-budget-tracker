begin;

select plan(9);

insert into auth.users (id, email)
values
  ('55555555-5555-4555-8555-555555555555', 'transfer-owner@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'transfer-other@example.test');

set local role postgres;
insert into public.accounts (id, user_id, name, type, currency, opening_balance)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '55555555-5555-4555-8555-555555555555', 'Checking', 'checking', 'USD', 1000),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '55555555-5555-4555-8555-555555555555', 'Savings', 'savings', 'USD', 0),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', '55555555-5555-4555-8555-555555555555', 'Chile', 'checking', 'CLP', 0),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', '66666666-6666-4666-8666-666666666666', 'Other', 'checking', 'USD', 0);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);

select lives_ok(
  $$select public.create_account_transfer('2026-09-04', 'Move to savings', '', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 300)$$,
  'an owner can transfer between same-currency accounts'
);
select is((select count(*)::integer from public.transactions where type = 'transfer'), 1, 'one transfer is created');
select is((select count(*)::integer from public.transaction_lines), 2, 'a transfer has two lines');
select is((select current_balance from public.account_details where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), '700.000000', 'source balance decreases');
select is((select current_balance from public.account_details where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), '300.000000', 'destination balance increases');
select is((select count(*)::integer from public.transaction_details), 1, 'the transfer list has one row');
select throws_ok(
  $$select public.create_account_transfer('2026-09-04', 'Same account', '', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1)$$,
  'P0001',
  'Transfer accounts must be different',
  'the same account cannot be both sides'
);
select throws_ok(
  $$select public.create_account_transfer('2026-09-04', 'Different currency', '', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 1)$$,
  'P0001',
  'Cross-currency transfers are not supported yet',
  'cross-currency transfers are rejected'
);
select throws_ok(
  $$select public.create_account_transfer('2026-09-04', 'Not mine', '', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 1)$$,
  'P0001',
  'Transfer account not found',
  'another user account cannot be targeted'
);

select * from finish();
rollback;
