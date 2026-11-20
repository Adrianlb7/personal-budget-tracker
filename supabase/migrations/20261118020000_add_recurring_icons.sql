alter table public.recurring_commitments
  add column icon_emoji text,
  add column icon_image_path text;

alter table public.recurring_commitments
  add constraint recurring_icon_exclusive_check
    check (icon_emoji is null or icon_image_path is null),
  add constraint recurring_icon_emoji_length_check
    check (icon_emoji is null or char_length(icon_emoji) between 1 and 32),
  add constraint recurring_icon_image_path_check
    check (
      icon_image_path is null or
      icon_image_path ~ ('^' || user_id::text || '/' || id::text || '/[0-9a-f-]{36}[.]png$')
    );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recurring-icons', 'recurring-icons', false, 2097152, array['image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png'];

create policy "Users can read their recurring icons"
on storage.objects for select to authenticated
using (
  bucket_id = 'recurring-icons'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload icons to their recurring items"
on storage.objects for insert to authenticated
with check (
  storage.objects.bucket_id = 'recurring-icons'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and array_length(storage.foldername(storage.objects.name), 1) = 2
  and storage.extension(storage.objects.name) = 'png'
  and exists (
    select 1 from public.recurring_commitments c
    where c.id::text = (storage.foldername(storage.objects.name))[2]
      and c.user_id = (select auth.uid())
  )
);

-- An old icon can still be removed after its recurring item is deleted.
create policy "Users can delete their recurring icons"
on storage.objects for delete to authenticated
using (
  bucket_id = 'recurring-icons'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
