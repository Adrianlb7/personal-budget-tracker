# UI/UX

## Design Direction

The application should feel like a modern fintech dashboard: calm, concise, spacious, and focused on financial clarity.

Orba's visual system uses soft, layered surfaces, restrained shadows, generous spacing, and a clear type hierarchy inspired by Apple's minimal interfaces. Keep the dashboard's liquid teal backdrop as its recognizable accent. Financial figures and actions must remain legible above it.

## Appearance

- Offer Light, Dark, and Auto modes from the app navigation and public entry screens.
- Store the choice in the browser. Auto follows the operating system and updates when its appearance changes.
- Apply the theme before the page paints to avoid a light flash in dark mode.
- Use semantic surface, text, border, and accent colors for new UI. Avoid hard-coded light backgrounds on forms, charts, and dialogs.
- Keep icons and labels visible without relying on color alone for the active navigation state.

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
3. Previous-month income guidance, current-month expenses, saved, savings rate
4. Spending trend
5. Upcoming payments and commitments

The dashboard should act as a financial cockpit. Detailed analytics belong in Reports.

## Recurring Commitments UI

Recurring commitments must clearly distinguish:

- Subscriptions: future expenses
- External installments: obligations to outside parties
- Savings reimbursements: internal transfers

Do not present all commitments as equivalent spending.

Each recurring card links to a permanent payment detail page. The timeline
shows actual recorded transactions, then upcoming dates projected from the
current plan. Completed installments entered before Orba tracking do not get
fabricated dates or amounts.
Keep this detail page in a compact receipt layout with aligned payment rows.
Its surface and text use the active appearance theme, and long names wrap on
small screens without horizontal scrolling.

## Multi-Currency UI

Show original currency first when viewing account and transaction detail. Converted display values may be shown as approximate:

```text
Chile Account
428,000 CLP
approx. 462 USD
```

Converted values should identify the rate date/source when used for reporting.
