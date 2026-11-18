# 018 Account Icons Spec

## Goal

Let each account have a personal icon without changing its financial data.

## Scope

- Select any Unicode emoji in a searchable catalog. Apple devices render these with the system Apple emoji font.
- Upload a picture, move and zoom it into a square crop, and save a PNG icon.
- Accept WebP pictures in the picker, including files whose browser-provided MIME type is missing, and convert the crop to PNG before upload.
- Preserve transparency when cropping and displaying PNGs. An image icon has no white tile behind it.
- Keep the icon control compact when creating and editing an account. Existing accounts retain their current type icon until changed.
- Store pictures in a private Supabase Storage bucket. Only the authenticated owner can upload or read their own account icon.

## Acceptance Criteria

- The account list and dashboard show the chosen emoji or image; they fall back to the account type icon otherwise.
- A non-square image can be positioned and zoomed before saving as a 1:1 PNG.
- A transparent PNG remains transparent in preview and final rendering.
- A WebP image can be selected and cropped on Safari; the saved account icon is a PNG.
- Changing or clearing an icon does not change balances or transaction history.
- Invalid image content, oversized uploads, and cross-user access are rejected by the server and Storage policies.
- The edit UI works at desktop and phone widths.
- A new account can be created with an emoji or cropped image, and the chosen icon appears immediately in the account list.
