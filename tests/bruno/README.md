# Parishram Engineering — Bruno API Collection

Covers every backend endpoint: auth (JWT cookies + Google OAuth), products, categories,
cart, addresses, quote enquiries, orders, admin (stats, upload), contact and file serving.

## Setup
1. Open Bruno → Open Collection → select this folder (`tests/bruno`).
2. Pick an environment: **Production** (preview URL) or **Local** (localhost:8001).
3. Auth uses JWT Bearer tokens: run **Auth → Login Admin** (or Login Customer / Register) first —
   the response script saves `accessToken` into the active environment, and every protected
   request automatically sends `Authorization: Bearer {{accessToken}}`.
   (The API also accepts httpOnly cookies for the web app, and Google OAuth session tokens as Bearer.)

## Environment variables
- `baseUrl` — set by environment.
- `accessToken` — auto-filled by Login/Register response scripts; sent as Bearer on protected requests.
- `refreshToken` — auto-filled by Login/Register. If you hit 401 "Token expired" (access tokens last 60 min), run **Auth → Refresh Token** to mint a fresh accessToken without logging in again.
- `productId` — defaults to seeded `ss-hex-nipple-304`.
- `variantId` — auto-filled from the **Get Product** response script; run it before Sync Cart / Create Order.
- `enquiryId`, `orderId`, `addressId`, `filePath` — copy from create/list responses when needed.

## Suggested run order
1. Auth → Login Admin
2. Products → Get Product (sets `variantId`)
3. Addresses → Create Address
4. Cart → Sync Cart, then Orders → Create Order
5. Orders → Admin List Orders → Admin Update Order Status
6. Enquiries → Create Enquiry → Admin Update Enquiry Status
7. Admin → Stats

## Notes
- `Admin Upload Photo` is multipart; drop a sample image at `tests/bruno/assets/sample-product.jpg` or repoint the file path.
- `Google Session Exchange` needs a real `session_id` from the OAuth redirect (`#session_id=...`).
- Orders validate and deduct stock server-side; cancelled orders restore stock.
