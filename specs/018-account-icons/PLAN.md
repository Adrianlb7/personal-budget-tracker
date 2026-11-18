# 018 Account Icons Plan

1. Extend `accounts` and `account_details` with mutually exclusive emoji and image path fields.
2. Add a private Storage bucket with account-owner policies and an authenticated image route.
3. Add account create and edit controls for emoji selection and square image crop, move, and zoom. For a new image icon, insert the owned account before uploading to its private folder, then save its image path.
4. Render chosen icons in account cards and the dashboard.
5. Verify icon validation, new-account icon persistence, authenticated reads, responsive UI, and regression checks.
6. Explicitly offer WebP in the file chooser and normalize missing WebP MIME metadata for the browser preview while keeping PNG-only storage.
