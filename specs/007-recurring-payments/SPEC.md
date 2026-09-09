# 007 Recurring Payments Spec

## Goal

Track recurring financial commitments while preserving their different accounting meanings.

## Scope

- Subscriptions.
- External installments.
- Next due dates.
- Monthly commitment summaries.

## Acceptance Criteria

- Subscriptions are treated as future expenses.
- External installments are tracked as obligations.
- The UI does not combine every commitment as the same kind of spending.
- Paused/cancelled states are supported.
- A subscription does not lock a source account during setup; the user chooses
  an active USD account each time they record a payment.
- Installments choose external expense versus savings reimbursement, source,
  and any savings destination separately for every recorded payment.
- Recurring payments are rejected atomically when the selected source account
  does not have enough available funds.
