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

Password recovery uses Supabase Auth and a same-origin callback. Configure the app's callback URL under Supabase Authentication → URL Configuration → Redirect URLs for each deployed origin (for example, `http://127.0.0.1:3000/auth/callback` for local use). Recovery requests use an implicit link so they can be opened in another browser. The callback reads the session tokens from the URL fragment, removes the fragment immediately, and posts them to the same-origin recovery-session route, which validates the session and sets SSR cookies before opening the password form. Supabase email delivery must be configured for recovery messages.

The password form posts the new password to a same-origin route that uses the recovered SSR session to call Supabase Auth. That route checks the Origin and Host headers, validates the password, and signs out only after a successful update. Never log the password or recovery tokens.

If custom SMTP is configured, the Reset password email template can link to the callback without calling Supabase's verification endpoint directly: `<a href="{{ .RedirectTo }}#token_hash={{ .TokenHash }}&amp;type=recovery">Reset password</a>`. The callback keeps the hash in browser memory and calls `verifyOtp` only after the user presses Continue. Supabase's built-in mailer does not allow template edits. Do not put the token hash in a query string or log it.

Supabase's built-in mailer sends only to Supabase organization team members and has a low project-wide rate limit. If the app account uses a different email address, configure custom SMTP before relying on email recovery.

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

