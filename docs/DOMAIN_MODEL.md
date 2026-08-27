# Domain Model

## Core Concepts

- User: the authenticated owner of all financial data.
- Account: a location where money or liabilities are tracked.
- Transaction: a financial event such as income, expense, or transfer.
- Category: user-owned classification for income or expenses.
- Budget: a monthly category limit.
- Recurring commitment: a future repeating financial obligation or planned movement.
- Savings reimbursement plan: a self-financed purchase with future internal repayments.
- Investment holding: invested asset tracked separately from liquid cash.
- Goal: target amount/date, optionally associated with a savings account.
- Snapshot: historical summary for reporting.

## Account Types

- Cash
- Checking
- Savings
- Investment
- Credit or debt

## Transaction Types

- Income: increases an account and counts as income.
- Expense: decreases an account and counts as spending.
- Transfer: moves value between owned accounts and does not count as income or expense.

Transfers may have source and destination amounts in different currencies. The original amount and currency for each side must be preserved.

## Self-Financed Purchase Rule

A self-financed purchase records the original purchase as the expense. Later repayments from checking to savings are real account transfers linked to the reimbursement plan.

Example:

- Purchase: `600 USD` paid from Savings, counted as one `600 USD` expense.
- Repayment: `100 USD` Checking -> Savings, counted as transfer only.
- Spending remains `600 USD`, not `1200 USD`.

The app may display pending reimbursements and projected savings after reimbursement, but this is not current balance or current net worth.

## Savings Rate

Approximate monthly savings rate:

```text
(income - expenses) / income
```

If income is zero, the rate should be `null` or `not applicable`, not infinite. UI copy should avoid implying a valid percentage when there is no income.

## Goals

Goals may reference an account balance but must not create duplicate assets. A savings account assigned to an emergency fund goal is still one account balance.

