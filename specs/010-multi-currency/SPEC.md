# 010 Multi-Currency Spec

## Goal

Support USD and CLP while preserving original transaction currency and allowing base-currency reporting.

## Scope

- Account currency.
- Transaction line currency.
- Base display currency.
- Optional manual FX rate context.
- Approximate converted display values.

## Acceptance Criteria

- Original transaction amount and currency are never overwritten.
- Dashboard may show approximate base-currency values.
- Historical reports can identify FX rate context.
- Missing FX rates are handled explicitly.

