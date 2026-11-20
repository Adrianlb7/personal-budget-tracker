begin;

select plan(5);

insert into auth.users (id, email)
values
  ('55555555-5555-4555-8555-555555555555', 'transaction-icon-owner@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'transaction-icon-other@example.test');

insert into public.transactions (id, user_id, type, date, description)
values
  ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 'expense', '2026-11-18', 'Owned purchase'),
  ('88888888-8888-4888-8888-888888888888', '66666666-6666-4666-8666-666666666666', 'expense', '2026-11-18', 'Other purchase');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('transaction-icons', '55555555-5555-4555-8555-555555555555/77777777-7777-4777-8777-777777777777/99999999-9999-4999-8999-999999999999.png')$$,
  'an owner can upload an icon under their transaction folder'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('transaction-icons', '55555555-5555-4555-8555-555555555555/88888888-8888-4888-8888-888888888888/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png')$$,
  '42501',
  null,
  'an owner cannot upload an icon under another owner transaction'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('transaction-icons', '66666666-6666-4666-8666-666666666666/77777777-7777-4777-8777-777777777777/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png')$$,
  '42501',
  null,
  'an owner cannot upload an icon under another user folder'
);

select is(
  public.set_transaction_icon('77777777-7777-4777-8777-777777777777', '🎧', null),
  true,
  'an owner can set their own transaction icon'
);

select is(
  public.set_transaction_icon('88888888-8888-4888-8888-888888888888', '🎧', null),
  false,
  'an owner cannot set another user transaction icon'
);

select * from finish();
rollback;
