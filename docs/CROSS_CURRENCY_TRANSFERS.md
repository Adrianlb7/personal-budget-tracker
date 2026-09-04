# Cross-Currency Transfer Design

Phase 005 intentionally enables same-currency transfers first. Cross-currency transfers remain disabled until the product captures enough context to preserve both original values.

A future cross-currency transfer should require:

- A source amount in the source account currency.
- A destination amount in the destination account currency.
- The effective exchange rate derived from those two entered amounts.
- An optional rate source and rate date.
- Any fee as a separate expense rather than silently reducing either transfer line.

Both amounts must be stored on their respective transaction lines. Reports may convert them later, but must never replace either original amount. Until this flow is implemented, the database and UI reject transfers between accounts with different currencies.
