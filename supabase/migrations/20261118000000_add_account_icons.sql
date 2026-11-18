alter table public.accounts
  add column icon_emoji text,
  add column icon_image_path text;

alter table public.accounts
  add constraint accounts_icon_exclusive_check
    check (icon_emoji is null or icon_image_path is null),
  add constraint accounts_icon_emoji_length_check
    check (icon_emoji is null or char_length(icon_emoji) between 1 and 32),
  add constraint accounts_icon_image_path_check
    check (
      icon_image_path is null or
      icon_image_path ~ ('^' || user_id::text || '/' || id::text || '/[0-9a-f-]{36}[.]png$')
    );

create or replace view public.account_details with (security_invoker = true) as
select
  a.id, a.user_id, a.name, a.type, a.currency,
  a.opening_balance::text as opening_balance,
  a.archived_at, a.created_at, a.updated_at,
  (a.opening_balance + coalesce(sum(
    case when l.direction = 'inflow' then l.amount else -l.amount end
  ), 0))::text as current_balance,
  a.icon_emoji, a.icon_image_path
from public.accounts a
left join public.transaction_lines l on l.account_id = a.id and l.user_id = a.user_id
group by a.id;

revoke all on table public.account_details from anon, authenticated;
grant select on table public.account_details to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('account-icons', 'account-icons', false, 2097152, array['image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png'];

-- Private object reads are limited to the authenticated user's folder.
create policy "Users can read their account icons"
on storage.objects for select to authenticated
using (
  bucket_id = 'account-icons'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload icons to their accounts"
on storage.objects for insert to authenticated
with check (
  storage.objects.bucket_id = 'account-icons'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and storage.extension(storage.objects.name) = 'png'
  and exists (
    select 1 from public.accounts a
    where a.id::text = (storage.foldername(storage.objects.name))[2]
      and a.user_id = (select auth.uid())
  )
);

-- Old objects can be removed after an account is deleted, too.
create policy "Users can delete their account icons"
on storage.objects for delete to authenticated
using (
  bucket_id = 'account-icons'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
