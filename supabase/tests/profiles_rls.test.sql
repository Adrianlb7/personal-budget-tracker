begin;

select plan(7);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.test');

select is((select count(*)::integer from public.profiles), 2, 'profiles are created by trigger');

set local role anon;
select throws_ok($$select * from public.profiles$$, '42501', null, 'anon cannot read profiles');
select throws_ok($$update public.profiles set display_currency = 'CLP'$$, '42501', null, 'anon cannot update profiles');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*)::integer from public.profiles), 1, 'a user reads only their profile');

update public.profiles set display_currency = 'CLP'
where id = '11111111-1111-1111-1111-111111111111';

select is(
  (select display_currency from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'CLP',
  'a user can update their display currency'
);
select is(
  (select count(*)::integer from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  0,
  'another profile is invisible'
);
select lives_ok(
  $$update public.profiles set display_currency = 'USD' where id = '22222222-2222-2222-2222-222222222222'$$,
  'an update targeting another profile affects no visible rows'
);

select * from finish();
rollback;
