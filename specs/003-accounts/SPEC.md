# 003 Accounts Spec

## Goal

Allow users to create, view, edit, archive, and calculate balances for accounts.

## Scope

- Cash, checking, savings, investment, and credit/debt account types.
- Account currency.
- Opening balance.
- Archived state.
- Derived balance calculation.

## Acceptance Criteria

- Accounts belong to one user.
- Archived accounts are hidden by default but remain available for history.
- Current balances can be derived from opening balance and transaction lines.
- Account ownership is enforced by RLS.

