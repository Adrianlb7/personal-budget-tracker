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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
