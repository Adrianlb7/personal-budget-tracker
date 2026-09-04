# Open Questions

## Product

- Should the first MVP allow manual balance adjustments, or should all corrections be reversal/adjustment transactions?
- Resolved in Phase 004: account deletion is blocked once transactions exist; archive or restore preserves financial history.
- Should categories be flat initially, or should parent/child categories ship in the first version?
- Should budgets support multiple currencies in the same month, or only the user's base currency initially?
- Should credit/debt accounts be included in MVP or deferred until external installment behavior is clearer?

## Money and Currency

- What is the initial base display currency: USD?
- How should missing FX rates be displayed in reports?
- Should CLP be formatted with zero decimal places everywhere, or should storage allow decimals while display rounds?
- For cross-currency transfers, should the user enter both source and destination amounts manually in MVP?

## Recurring and Reimbursements

- Resolved in Phase 007: commitments create transactions only when the user presses Pay. Subscriptions create expenses; installment repayments create internal transfers to savings.
- Can a savings reimbursement plan be paused or edited after installments have started?
- Resolved in Phase 007: the original purchase is the expense; installment repayments replenish savings through internal transfers and never duplicate spending.

## Reporting

- Are monthly snapshots created automatically at month close, manually, or both?
- Should reports use transaction date, creation date, or posted date once imports are introduced?
