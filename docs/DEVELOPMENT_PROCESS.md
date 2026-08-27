# Development Process

## Route From Spec To Shipped Work

Every feature should move through this route:

1. Spec drafted in `specs/<number>-<feature>/SPEC.md`.
2. Implementation approach written in `PLAN.md`.
3. Work split into checkable items in `TASKS.md`.
4. GitHub issue created from the relevant spec and placed in Backlog.
5. Issue moved to Ready when the scope is clear.
6. Branch created with the `codex/` prefix.
7. Implementation completed with tests while the issue is In Progress.
8. Pull request opened and moved to In Review.
9. Merged after verification and moved to Done.

## Recommended GitHub Project

Use the GitHub Project board linked to this repository.

Board columns:

- Backlog
- Ready
- In Progress
- In Review
- Done

Suggested fields:

- Phase: 001 through 013
- Type: Spec, Feature, Bug, Chore, Test, Documentation
- Priority: P0, P1, P2, P3

Suggested issue flow:

- Backlog: captured work that is not ready to start.
- Ready: scoped work with clear acceptance criteria.
- In Progress: active implementation branch exists.
- In Review: pull request or review checkpoint is active.
- Done: merged or otherwise completed and verified.

Suggested views:

- Roadmap: grouped by Phase
- Active Work: filtered to Ready, In Progress, In Review
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
