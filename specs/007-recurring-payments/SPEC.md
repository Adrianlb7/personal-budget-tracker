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
- Completing the final installment shows a congratulatory confirmation.
- The active commitment summary is labelled as the next month's bill.
- Every commitment has a persistent payment detail view with recorded
  transactions and projected due dates. Historical amounts come from the
  original transactions; projections use the current plan amount.
- Installments completed before they were tracked have no invented payment
  dates or amounts in the detail view.
