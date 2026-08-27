# 002 Authentication Spec

## Goal

Require Supabase authentication before accessing financial data.

## Scope

- Sign-in/sign-out flows.
- Protected app routes.
- Profile creation for authenticated users.
- Display currency preference on profile.

## Acceptance Criteria

- Unauthenticated users cannot access app routes.
- Authenticated users can sign out.
- A user profile exists for each app user.
- Financial queries are never made without an authenticated user context.

