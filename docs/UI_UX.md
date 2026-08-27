# UI/UX

## Design Direction

The application should feel like a modern fintech dashboard: calm, concise, spacious, and focused on financial clarity.

## Layout

- Persistent left sidebar on desktop
- Collapsible navigation on smaller screens
- Main dashboard content area
- Large primary financial metric at the top
- Secondary cards for account groups and monthly metrics
- Clear global `Add transaction` action
- Responsive design

## Dashboard Priority

1. Total net worth
2. Account/asset breakdown
3. Current month income, expenses, saved, savings rate
4. Spending trend
5. Upcoming payments and commitments

The dashboard should act as a financial cockpit. Detailed analytics belong in Reports.

## Recurring Commitments UI

Recurring commitments must clearly distinguish:

- Subscriptions: future expenses
- External installments: obligations to outside parties
- Savings reimbursements: internal transfers

Do not present all commitments as equivalent spending.

## Multi-Currency UI

Show original currency first when viewing account and transaction detail. Converted display values may be shown as approximate:

```text
Chile Account
428,000 CLP
approx. 462 USD
```

Converted values should identify the rate date/source when used for reporting.

