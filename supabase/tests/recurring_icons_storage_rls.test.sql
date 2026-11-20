begin;

select plan(3);

insert into auth.users (id, email)
values
  ('55555555-5555-4555-8555-555555555555', 'recurring-icon-owner@example.test'),
  ('66666666-6666-4666-8666-666666666666', 'recurring-icon-other@example.test');

insert into public.recurring_commitments
  (id, user_id, kind, name, amount, currency, frequency, starts_on, next_due_on)
values
  ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 'subscription', 'Gym', 30, 'USD', 'monthly', '2026-11-01', '2026-12-01'),
  ('88888888-8888-4888-8888-888888888888', '66666666-6666-4666-8666-666666666666', 'subscription', 'Other', 30, 'USD', 'monthly', '2026-11-01', '2026-12-01');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);

select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('recurring-icons', '55555555-5555-4555-8555-555555555555/77777777-7777-4777-8777-777777777777/99999999-9999-4999-8999-999999999999.png')$$,
  'an owner can upload an icon under their recurring item folder'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('recurring-icons', '55555555-5555-4555-8555-555555555555/88888888-8888-4888-8888-888888888888/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png')$$,
  '42501',
  null,
  'an owner cannot upload an icon under another owner recurring item'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('recurring-icons', '66666666-6666-4666-8666-666666666666/77777777-7777-4777-8777-777777777777/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.png')$$,
  '42501',
  null,
  'an owner cannot upload an icon under another user folder'
);

select * from finish();
rollback;
