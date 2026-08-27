# Architecture

## Stack

- Framework: Next.js
- Language: TypeScript
- UI: React, Tailwind CSS, shadcn/ui
- Forms: React Hook Form
- Validation: Zod
- Charts: Recharts
- Database: Supabase PostgreSQL
- Auth: Supabase Auth
- Security: Supabase Row Level Security
- Tests: Vitest, Playwright
- Hosting: Vercel

## Application Flow

Next.js renders authenticated app routes and communicates directly with Supabase. PostgreSQL owns durable financial state. RLS enforces user boundaries.

```text
Browser
  -> Next.js app
  -> Supabase client
  -> PostgreSQL with RLS
```

## Recommended App Structure

```text
src/
  app/
    (auth)/
    (app)/
  components/
    app-shell/
    finance/
    ui/
  lib/
    money/
    dates/
    supabase/
    validation/
  domain/
    accounts/
    transactions/
    budgets/
    recurring/
    investments/
    reports/
  test/
```

## Architectural Risks

- Money precision bugs if calculations use JavaScript numbers.
- Incorrect financial analytics if transfers and reimbursements are counted as expenses.
- User data exposure if RLS policies are incomplete.
- Historical report drift if snapshots duplicate too much derived data.
- FX confusion if converted display values overwrite original transaction currency.
- Overbuilt infrastructure if personal-use scope is ignored.

## Initial Decisions

- Do not introduce Prisma initially.
- Use PostgreSQL `numeric` columns and domain-level decimal helpers.
- Preserve original currency on every transaction line.
- Derive account balances from immutable or append-only financial movements.
- Use snapshots selectively for month-end reporting summaries, not as the source of truth for balances.

