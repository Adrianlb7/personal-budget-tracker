# 014 Progressive Web App Specification

## Goal

Turn the deployed personal finance application into an installable PWA named Orba while keeping authenticated financial data network-only.

## Requirements

- Use Orba as the product and installed application name.
- Launch the installed application at `/app` in standalone, portrait-first mode.
- Preserve the existing bank icon until the final Orba icon is designed.
- Provide a calm offline screen when authenticated data cannot be reached.
- Never cache Supabase responses, financial pages, balances, transactions, or authenticated HTML.
- Register the service worker only in production.
- Adapt the dashboard to the approved mobile concept in a separate responsive-layout task.
- Preserve the complete desktop experience.

## Production

- Canonical URL: `https://personal-budget-tracker-three-sooty.vercel.app`
- Hosting: Vercel
- Data and authentication: Supabase
