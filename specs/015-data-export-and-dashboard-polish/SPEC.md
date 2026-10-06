# 015 Data Export and Dashboard Polish Spec

## Goal

Let the signed-in owner download a readable snapshot of their own financial data, align the dashboard income guide with the prior calendar month, and keep long financial labels within mobile width.

## Acceptance Criteria

- Reports offers a JSON download containing account balances, transaction history, recent expenses, recurring commitments, categories, and budgets.
- The export is authenticated, owner-scoped, not cached, and never includes credentials or another user's data.
- Original transaction currencies and decimal values are preserved; transfers remain transfers.
- Dashboard card reads `Income last month` and calculates the prior calendar month's USD income, including across a year boundary. Current-month spending and savings calculations remain unchanged.
- Long names and amounts do not create horizontal page overflow on narrow mobile screens. Desktop layout remains intact.
