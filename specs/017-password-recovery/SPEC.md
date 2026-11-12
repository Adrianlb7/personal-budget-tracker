# 017 Password Recovery

## Goal

Let an existing Orba user regain access without knowing the current password.

## Scope

- A public reset request form linked from sign-in.
- A Supabase recovery email that returns through a fixed, same-origin callback.
- The recovery link works when opened in a different browser or device from the request.
- The email may lead to a confirmation page that does not consume its one-time token until the user clicks Continue, protecting against email link scanners.
- A new-password form available only with a valid authenticated session, including one established by the recovery link.
- Generic request confirmation so the form does not reveal whether an email is registered.

## Acceptance Criteria

- Requesting a reset never reads or changes financial records.
- Invalid or expired links do not expose the password form.
- A valid link lets the user set a new password and then sign in with it.
- Recovery redirect targets stay on this app's origin.
