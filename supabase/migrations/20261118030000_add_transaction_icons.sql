alter table public.transactions
  add column icon_emoji text,
  add column icon_image_path text;

alter table public.transactions
  add constraint transactions_icon_exclusive_check
    check (icon_emoji is null or icon_image_path is null),
  add constraint transactions_icon_emoji_length_check
    check (icon_emoji is null or char_length(icon_emoji) between 1 and 32),
  add constraint transactions_icon_image_path_check
    check (
      icon_image_path is null or
      icon_image_path ~ ('^' || user_id::text || '/' || id::text || '/[0-9a-f-]{36}[.]png$')
    );

create or replace view public.transaction_details with (security_invoker = true) as
select
  t.id, t.user_id, t.type, t.date, t.description, t.notes, t.metadata, t.created_at,
  (array_agg(l.account_id) filter (where l.direction = 'outflow' or t.type = 'income'))[1] as account_id,
  max(a.name) filter (where l.direction = 'outflow' or t.type = 'income') as account_name,
  (array_agg(l.category_id) filter (where l.category_id is not null))[1] as category_id,
  max(c.name) as category_name,
  case when t.type = 'income' then 'inflow' else 'outflow' end as direction,
  (max(l.amount) filter (where l.direction = 'outflow' or t.type = 'income'))::text as amount,
  max(l.currency) filter (where l.direction = 'outflow' or t.type = 'income') as currency,
  (array_agg(l.account_id) filter (where t.type = 'transfer' and l.direction = 'inflow'))[1] as destination_account_id,
  max(a.name) filter (where t.type = 'transfer' and l.direction = 'inflow') as destination_account_name,
  (max(l.amount) filter (where t.type = 'transfer' and l.direction = 'inflow'))::text as destination_amount,
  max(l.currency) filter (where t.type = 'transfer' and l.direction = 'inflow') as destination_currency,
  t.icon_emoji, t.icon_image_path
from public.transactions t
join public.transaction_lines l on l.transaction_id = t.id and l.user_id = t.user_id
join public.accounts a on a.id = l.account_id and a.user_id = l.user_id
left join public.categories c on c.id = l.category_id and c.user_id = l.user_id
group by t.id;

revoke all on table public.transaction_details from anon, authenticated;
grant select on table public.transaction_details to authenticated;

-- Financial fields stay writable only through their dedicated RPCs.
create or replace function public.set_transaction_icon(
  p_transaction_id uuid,
  p_icon_emoji text,
  p_icon_image_path text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  changed boolean;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if p_icon_emoji is not null and p_icon_image_path is not null then
    raise exception 'Choose only one transaction icon';
  end if;
  update public.transactions
    set icon_emoji = p_icon_emoji,
        icon_image_path = p_icon_image_path
    where id = p_transaction_id and user_id = owner_id
    returning true into changed;
  return coalesce(changed, false);
end;
$$;

revoke all on function public.set_transaction_icon(uuid, text, text) from public, anon;
grant execute on function public.set_transaction_icon(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('transaction-icons', 'transaction-icons', false, 2097152, array['image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png'];

create policy "Users can read their transaction icons"
on storage.objects for select to authenticated
using (
  storage.objects.bucket_id = 'transaction-icons'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
);

create policy "Users can upload icons to their transactions"
on storage.objects for insert to authenticated
with check (
  storage.objects.bucket_id = 'transaction-icons'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and storage.extension(storage.objects.name) = 'png'
  and exists (
    select 1 from public.transactions t
    where t.id::text = (storage.foldername(storage.objects.name))[2]
      and t.user_id = (select auth.uid())
  )
);

-- Allow cleanup after a transaction is deleted.
create policy "Users can delete their transaction icons"
on storage.objects for delete to authenticated
using (
  storage.objects.bucket_id = 'transaction-icons'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
);
