# Development Process

## Route From Spec To Shipped Work

Every feature should move through this route:

1. Spec drafted in `specs/<number>-<feature>/SPEC.md`.
2. Implementation approach written in `PLAN.md`.
3. Work split into checkable items in `TASKS.md`.
4. GitHub issue created from the relevant spec.
5. Branch created with the `codex/` prefix.
6. Implementation completed with tests.
7. Pull request reviewed against acceptance criteria.
8. Merged after verification.

## Recommended GitHub Project

Create a GitHub Project named `Personal Finance Hub Development`.

Suggested fields:

- Status: Inbox, Spec Review, Ready, In Progress, Verification, Done, Blocked
- Phase: 001 through 013
- Type: Spec, Feature, Bug, Chore, Test, Documentation
- Priority: P0, P1, P2, P3

Suggested views:

- Roadmap: grouped by Phase
- Active Work: filtered to Ready, In Progress, Verification, Blocked
- Specs: filtered to Type = Spec
- Testing: filtered to Type = Test

## Issue Naming

Use this title shape:

```text
[Phase 003] Accounts: create account schema and RLS
```

## Branch Naming

Use this branch shape:

```text
codex/003-accounts-schema-rls
```

## Pull Request Checklist

- Relevant spec acceptance criteria are addressed.
- Financial calculations are covered by deterministic tests.
- RLS and ownership behavior are covered where data access changed.
- No secrets or personal financial data are committed.
- Documentation is updated when behavior changes.

