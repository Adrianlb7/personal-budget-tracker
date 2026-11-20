# 019 Recurring and Transaction Icons Spec

## Goal

Let a user personalize recurring commitments and transactions with an optional emoji or image while preserving their existing type icons by default.

## Scope

- Reuse the account icon picker: searchable emoji catalog, square crop with move and zoom, WebP/JPEG/PNG input, and transparent PNG output.
- Offer the compact icon control when creating or editing subscriptions, installments, income, expenses, and transfers.
- Show a chosen icon in recurring cards, the payment detail header, transaction rows, and the dashboard's upcoming commitments and recent activity. When no icon is chosen, keep the icon currently used for that item type.
- Persist emoji and image choices on the owned recurring commitment or transaction. Store images in private, owner-only Supabase Storage buckets and serve them only after checking authenticated ownership.
- Include icon choice metadata in the JSON export. Image bytes remain in private Storage.
- Preserve amounts, currencies, account balances, payment schedules, and transaction classification. Icon changes must not create or alter financial movements.

## Acceptance Criteria

- Existing items show the same default icons after the migration.
- A user can add, replace, or clear an emoji or cropped image on a recurring commitment or transaction. Clearing restores the default icon.
- A transparent image has no white tile, including in light and dark themes and on narrow phone screens.
- Unsupported or oversized files and cross-user reads/uploads are rejected by the server and Storage policies.
- Editing an icon does not change financial values or recurring progress.
- Deleting a transaction cleans up its owned icon image. Cancelled or completed recurring plans retain their icon and payment history.
- The account icon feature continues to work unchanged.

## Open Question

- Should a payment transaction created from a recurring commitment inherit that commitment's icon, or have only its own optional icon and existing transaction-type fallback? This phase keeps the transaction's icon independent until the behavior is specified.
