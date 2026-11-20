# Orba

A personal-use financial dashboard for understanding current money, account locations, cash flow, recurring commitments, savings, investments, goals, and net worth over time.

This repository follows a spec-driven development workflow. Do not implement broad product areas until their corresponding specification is reviewed and broken into small, verifiable tasks.

## Product Shape

- Next.js, TypeScript, React, Tailwind CSS, shadcn/ui
- Supabase PostgreSQL, Supabase Auth, Row Level Security
- React Hook Form, Zod, Recharts, date-fns
- Vitest for domain/unit coverage
- Playwright for end-to-end financial workflows
- Vercel hosting

## Documentation Map

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Domain Model](docs/DOMAIN_MODEL.md)
- [Database](docs/DATABASE.md)
- [Security](docs/SECURITY.md)
- [UI/UX](docs/UI_UX.md)
- [Testing](docs/TESTING.md)
- [Roadmap](docs/ROADMAP.md)
- [Open Questions](docs/OPEN_QUESTIONS.md)
- [Development Process](docs/DEVELOPMENT_PROCESS.md)

## Development Rule

Each feature should start from a spec under `specs/`, then move through plan, tasks, implementation, and verification. Financial behavior must be covered by deterministic tests before it is treated as complete.

## Local Setup

### Requirements

- Node.js 24 or newer
- npm 11 or newer
- A Supabase project (required beginning with the authentication phase)

### Install and run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Phase 001 placeholder does not connect to Supabase yet, so its environment values may remain empty until Phase 002.

### Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Find these values in your Supabase project's API settings. Never expose a service-role or secret key to client code, and never commit a populated environment file.

### Supabase authentication setup

1. Create or open your Supabase project.
2. Copy `.env.example` to `.env.local` and enter the project URL and anon key.
3. Apply `supabase/migrations/20260829113000_create_profiles.sql` through the Supabase SQL editor or your configured Supabase CLI workflow.
4. Create your personal user under Authentication → Users in the Supabase dashboard.
5. Start the app and sign in at [http://localhost:3000/sign-in](http://localhost:3000/sign-in).

The profile migration creates a private profile automatically for every new Auth user. Its RLS policies permit authenticated users to read and update only their own profile.

### Account icon migration

Before using emoji or image icons on an existing project, apply [`supabase/migrations/20261118000000_add_account_icons.sql`](supabase/migrations/20261118000000_add_account_icons.sql) in the Supabase SQL editor or through your configured migration workflow. It adds the icon fields and a private PNG Storage bucket. Apply it before deploying the matching app code, because the account and dashboard queries read the new fields.

For recurring commitment and transaction icons, apply [recurring migration](supabase/migrations/20261118020000_add_recurring_icons.sql) and [transaction migration](supabase/migrations/20261118030000_add_transaction_icons.sql) in that order before deploying the matching app code. These add optional icon fields and private image storage; existing items keep their default icons.

### Verification

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Playwright starts the development server automatically for end-to-end tests.
