begin;

select plan(7);

insert into auth.users (id, email)
values
  ('99999999-9999-4999-8999-999999999999', 'budget-owner@example.test'),
  ('aaaaaaaa-9999-4999-8999-999999999999', 'budget-other@example.test');

set local role postgres;
insert into public.categories (id, user_id, name, kind)
values
  ('bbbbbbbb-9999-4999-8999-999999999999', '99999999-9999-4999-8999-999999999999', 'Groceries', 'expense'),
  ('cccccccc-9999-4999-8999-999999999999', '99999999-9999-4999-8999-999999999999', 'Salary', 'income'),
  ('dddddddd-9999-4999-8999-999999999999', 'aaaaaaaa-9999-4999-8999-999999999999', 'Other', 'expense');

set local role anon;
select throws_ok($$select * from public.monthly_budgets$$, '42501', null, 'anon cannot read budgets');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-9999-4999-8999-999999999999","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.monthly_budgets (user_id, category_id, month, currency, amount)
    values ('99999999-9999-4999-8999-999999999999', 'bbbbbbbb-9999-4999-8999-999999999999', '2026-09-01', 'USD', 300.25)$$,
  'an owner can create an expense budget'
);
select is((select count(*)::integer from public.monthly_budgets), 1, 'an owner sees their budget');
select throws_ok(
  $$insert into public.monthly_budgets (user_id, category_id, month, currency, amount)
    values ('99999999-9999-4999-8999-999999999999', 'cccccccc-9999-4999-8999-999999999999', '2026-09-01', 'USD', 100)$$,
  'P0001',
  'Budgets require an expense category',
  'income categories cannot be budgeted'
);
select throws_ok(
  $$insert into public.monthly_budgets (user_id, category_id, month, currency, amount)
    values ('aaaaaaaa-9999-4999-8999-999999999999', 'dddddddd-9999-4999-8999-999999999999', '2026-09-01', 'USD', 100)$$,
  '42501',
  null,
  'a user cannot create another owner budget'
);
select lives_ok(
  $$update public.monthly_budgets set amount = 350 where user_id = '99999999-9999-4999-8999-999999999999'$$,
  'an owner can update their budget'
);
select lives_ok(
  $$delete from public.monthly_budgets where user_id = '99999999-9999-4999-8999-999999999999'$$,
  'an owner can delete their budget'
);

select * from finish();
rollback;
