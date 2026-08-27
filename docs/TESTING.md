# Testing

## Test Layers

- Domain tests with Vitest for money math, balances, reporting, budgets, and recurring logic.
- Component tests where UI state has important behavior.
- Playwright tests for critical workflows once screens exist.
- Supabase migration/RLS verification where practical.

## Critical Domain Scenarios

- Create accounts.
- Record income.
- Record expenses.
- Transfer between accounts.
- Verify transfers do not affect income or expenses.
- Calculate balances from opening balances and transaction lines.
- Calculate net worth.
- Calculate savings rate and zero-income behavior.
- Preserve transaction original currency.
- Use FX context for reports without permanently converting transactions.
- Track recurring subscriptions.
- Track external installment progress.
- Track self-financed purchases.
- Prevent savings reimbursements from becoming duplicate expenses.
- Calculate category budgets.
- Generate monthly reporting snapshots.
- Enforce ownership boundaries.
- Verify deterministic decimal precision.

## Critical E2E Scenario

1. Create Checking and Savings.
2. Add `1000 USD` income to Checking.
3. Transfer `300 USD` Checking -> Savings.
4. Verify Checking = `700`, Savings = `300`, expenses = `0`, income = `1000`, net worth = `1000`.
5. Purchase `600 USD` from Savings as a self-financed purchase.
6. Verify Savings decreases and expense = `600`.
7. Create six `100 USD` reimbursements.
8. Process one reimbursement Checking -> Savings.
9. Verify additional expense = `0` and reimbursement remaining = `500`.

