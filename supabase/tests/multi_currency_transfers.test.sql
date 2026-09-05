begin;
select plan(7);

insert into auth.users (id, email) values
  ('77777777-7777-4777-8777-777777777777', 'fx-owner@example.test');
set local role postgres;
insert into public.accounts (id, user_id, name, type, currency, opening_balance) values
  ('11111111-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', 'Chile', 'checking', 'CLP', 1000000),
  ('22222222-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', 'USD checking', 'checking', 'USD', 0),
  ('33333333-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', 'USD savings', 'savings', 'USD', 0),
  ('44444444-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', 'Bitcoin', 'investment', 'BTC', 0.12345678);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select lives_ok(
  $$select public.create_clp_usd_transfer('2026-09-05', 'Bank conversion', '', '11111111-7777-4777-8777-777777777777', '22222222-7777-4777-8777-777777777777', 1000000, 910)$$,
  'owner can convert CLP into USD checking'
);
select is((select count(*)::integer from public.transactions where type = 'transfer'), 1, 'one transfer is created');
select is((select current_balance from public.account_details where id = '11111111-7777-4777-8777-777777777777'), '0.000000', 'CLP source is debited');
select is((select current_balance from public.account_details where id = '22222222-7777-4777-8777-777777777777'), '1098.901099', 'USD destination receives the divided amount');
select is((select metadata->>'clp_per_usd' from public.transactions limit 1), '910', 'manual rate is preserved');
select is((select opening_balance::text from public.accounts where currency = 'BTC'), '0.12345678', 'BTC keeps eight decimals');
select throws_ok(
  $$select public.create_clp_usd_transfer('2026-09-05', 'Wrong destination', '', '11111111-7777-4777-8777-777777777777', '33333333-7777-4777-8777-777777777777', 1, 910)$$,
  'P0001', 'Destination must be an active USD checking account', 'CLP cannot go directly to savings'
);
select * from finish();
rollback;
