# Security

## Requirements

- Supabase Auth is required.
- Every user-owned financial table must include `user_id`.
- Row Level Security must be enabled on every user-owned table.
- Policies must restrict read/write access to `auth.uid() = user_id`.
- Foreign-key relationships must not allow cross-user references.
- Secrets must never be committed.

## Environment

Commit `.env.example` only. Local `.env.local` and production secrets belong outside Git.

## RLS Pattern

Each table should have policies equivalent to:

```sql
create policy "Users can read own rows"
on table_name for select
using (auth.uid() = user_id);

create policy "Users can insert own rows"
on table_name for insert
with check (auth.uid() = user_id);

create policy "Users can update own rows"
on table_name for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own rows"
on table_name for delete
using (auth.uid() = user_id);
```

Actual migrations should tailor delete behavior by table. Financial records may need soft-delete or reversal entries instead of destructive deletion.

## Sensitive Data

This app stores financial information. Logs, screenshots, seed data, and test fixtures must avoid real account numbers, access tokens, or private financial data.

