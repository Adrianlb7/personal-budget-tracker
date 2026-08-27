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
