-- Qualify the outer object path inside the account ownership subquery.
-- Unqualified name resolves to public.accounts.name there and rejects uploads.
alter policy "Users can upload icons to their accounts"
on storage.objects
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
