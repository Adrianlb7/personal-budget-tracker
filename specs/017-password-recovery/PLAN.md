# 017 Plan

1. Add a public request form and sign-in link. Request an implicit recovery email through Next.js so the link can open in another browser.
2. Receive the recovery session on the callback page, then post it to a same-origin route handler that validates it and writes SSR cookies.
3. Add an authenticated new-password form that updates the password through a same-origin server route, then clears the session after success.
4. Add focused tests and document the required Supabase redirect URL.
