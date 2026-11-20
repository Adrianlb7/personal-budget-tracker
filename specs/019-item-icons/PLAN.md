# 019 Recurring and Transaction Icons Plan

1. Extend recurring commitments and transactions with mutually exclusive emoji and image path fields; expose transaction fields in the detail view without changing existing view columns.
2. Add private image Storage buckets and owner-only read, upload, and delete policies. Qualify the outer object path inside ownership subqueries.
3. Reuse the square image crop and emoji picker in create and edit forms. Validate final PNG bytes on the server and retain current icon values when editing unrelated fields.
4. Add authenticated image routes and custom-or-default renderers for recurring and transaction items.
5. Show icons in recurring cards and payment detail, transaction lists, and dashboard activity and upcoming commitments. Include icon metadata in exports.
6. Verify validation, ownership, default behavior, optional edits, responsive layouts, existing account icons, and financial calculation regression.
7. Apply migrations to hosted Supabase before deploying the matching frontend; verify image upload and private reads with an authenticated production session.
