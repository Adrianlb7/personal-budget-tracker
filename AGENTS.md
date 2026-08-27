# Codex Development Guide

## Working Style

This project uses spec-driven development. Before implementing a feature, read the relevant files in `docs/` and the matching numbered folder under `specs/`.

## Ground Rules

- Keep the app personal-use in scope.
- Preserve original transaction currency.
- Never use JavaScript floating point as authoritative money math.
- Treat transfers as internal movement, not income or expense.
- Treat savings reimbursements as internal transfers linked to a plan, not duplicate expenses.
- Require authenticated user ownership for all financial data.
- Protect data with Supabase Row Level Security, not only frontend checks.
- Prefer Supabase client access from Next.js over introducing a separate backend.
- Do not commit secrets. Keep `.env.example` current.

## Expected Verification

- Add or update Vitest coverage for domain calculations.
- Add Playwright coverage for critical user workflows once UI exists.
- Run the smallest relevant test suite before closing a task.
- Document unresolved ambiguities in `docs/OPEN_QUESTIONS.md`.

