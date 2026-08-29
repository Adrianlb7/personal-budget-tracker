# Personal Finance Hub

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
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose the service-role key to client code or commit a populated environment file.

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
