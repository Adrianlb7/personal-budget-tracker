# Database

## Balance Strategy

Balances should be derived from financial movement records rather than edited independently. An account may store an opening balance, but current balance is calculated as:

```text
opening_balance
+ income transaction lines
- expense transaction lines
+ incoming transfers
- outgoing transfers
+/- adjustments, if introduced later
```

This keeps balances explainable and auditable. If cached balances are introduced later for performance, they must be rebuildable from source records and validated by tests.

## Money Precision Strategy

PostgreSQL should store authoritative money values as `numeric`, not floating-point.

Recommended initial precision:

- Fiat transaction amounts: `numeric(20, 6)`
- FX rates: `numeric(24, 12)`
- Investment/crypto quantities: `numeric(30, 12)`

The scale intentionally supports USD cents, CLP whole amounts, historical FX rates, and future crypto/investment values. UI formatting decides how many decimals to show per currency; storage should not silently round away valid precision.

TypeScript domain calculations should use a decimal library or string-based decimal helpers. JavaScript `number` may be used for chart display after calculations are complete, but not as authoritative storage or calculation state.

## Candidate Tables

### profiles

- id references auth.users
- display_currency
- created_at
- updated_at

### accounts

- id
- user_id
- name
- type
- currency
- opening_balance
- archived_at
- created_at
- updated_at

### categories

- id
- user_id
- name
- kind: income or expense
- parent_category_id
- archived_at
- created_at
- updated_at

### transactions

- id
- user_id
- type: income, expense, transfer
- date
- description
- notes
- metadata jsonb
- created_at
- updated_at

### transaction_lines

- id
- transaction_id
- user_id
- account_id
- category_id
- direction: inflow or outflow
- amount
- currency
- fx_rate_to_base
- fx_rate_source
- fx_rate_date
- created_at

Transfers should usually have one outflow line and one inflow line. Income and expense may start as single-line transactions.

### budgets

- id
- user_id
- month
- category_id
- amount
- currency
- created_at
- updated_at

### recurring_commitments

- id
- user_id
- kind: subscription, external_installment, savings_reimbursement
- name
- account_id
- category_id
- amount
- currency
- frequency
- starts_on
- next_due_on
- ends_on
- status
- metadata jsonb
- created_at
- updated_at

### savings_reimbursement_plans

- id
- user_id
- original_expense_transaction_id
- source_account_id
- destination_account_id
- purchase_amount
- currency
- installment_amount
- installment_count
- installments_completed
- next_due_on
- status
- created_at
- updated_at

### investments

- id
- user_id
- account_id
- name
- symbol
- quantity
- quantity_precision
- cost_basis_amount
- cost_basis_currency
- current_value_amount
- current_value_currency
- valuation_as_of
- created_at
- updated_at

### goals

- id
- user_id
- name
- target_amount
- currency
- target_date
- account_id
- created_at
- updated_at

### monthly_snapshots

- id
- user_id
- month
- base_currency
- net_worth
- liquid_assets
- invested_assets
- income
- expenses
- saved
- metadata jsonb
- created_at

## Snapshot Strategy

Transactions remain the source of truth. Monthly snapshots store reporting summaries as of month close to preserve historical views and avoid repeatedly recalculating long ranges. Snapshots should include enough metadata to identify the FX assumptions used.

