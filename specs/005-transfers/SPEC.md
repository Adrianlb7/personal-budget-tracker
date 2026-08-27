# 005 Transfers Spec

## Goal

Support internal transfers between owned accounts without counting them as income or expenses.

## Scope

- Transfer transaction type.
- Source and destination account lines.
- Optional cross-currency transfer support.
- Reporting exclusion from income and expense.

## Acceptance Criteria

- Source account decreases.
- Destination account increases.
- Spending reports are unaffected.
- Income reports are unaffected.
- Net worth is unchanged for same-currency transfers.
- Cross-currency transfers preserve both original currency amounts and FX context.

