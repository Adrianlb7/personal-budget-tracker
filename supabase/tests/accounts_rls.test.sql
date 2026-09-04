begin;

select plan(11);

insert into auth.users (id, email)
values
  ('33333333-3333-3333-3333-333333333333', 'account-owner@example.test'),
  ('44444444-4444-4444-4444-444444444444', 'account-other@example.test');

set local role anon;
select throws_ok($$select * from public.accounts$$, '42501', null, 'anon cannot read accounts');
select throws_ok($$select * from public.account_details$$, '42501', null, 'anon cannot read account details');
select throws_ok(
  $$insert into public.accounts (user_id, name, type, currency) values ('33333333-3333-3333-3333-333333333333', 'Cash', 'cash', 'USD')$$,
  '42501',
  null,
  'anon cannot create accounts'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.accounts (user_id, name, type, currency, opening_balance) values ('33333333-3333-3333-3333-333333333333', 'Checking', 'checking', 'USD', 1000.25)$$,
  'an owner can create an account'
);
select throws_ok(
  $$insert into public.accounts (user_id, name, type, currency) values ('44444444-4444-4444-4444-444444444444', 'Not mine', 'cash', 'USD')$$,
  '42501',
  null,
  'a user cannot create an account for someone else'
);
select is((select count(*)::integer from public.accounts), 1, 'an owner sees their account');
select is(
  (select opening_balance from public.account_details limit 1),
  '1000.250000',
  'account details return exact money as text'
);

set local role postgres;
insert into public.accounts (user_id, name, type, currency)
values ('44444444-4444-4444-4444-444444444444', 'Other savings', 'savings', 'USD');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is((select count(*)::integer from public.accounts), 1, 'another user account is invisible');
select lives_ok(
  $$update public.accounts set archived_at = now() where user_id = '33333333-3333-3333-3333-333333333333'$$,
  'an owner can archive their account'
);
select lives_ok(
  $$update public.accounts set archived_at = now() where user_id = '44444444-4444-4444-4444-444444444444'$$,
  'an update targeting another owner affects no visible rows'
);
select throws_ok(
  $$delete from public.accounts where user_id = '33333333-3333-3333-3333-333333333333'$$,
  '42501',
  null,
  'accounts cannot be deleted through the client role'
);

select * from finish();
rollback;
