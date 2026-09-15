# Parishram Engineering — Bruno API Collection

Covers every backend endpoint: auth (JWT cookies + Google OAuth), products, categories,
cart, addresses, quote enquiries, orders, admin (stats, upload), contact and file serving.

## Setup
1. Open Bruno → Open Collection → select this folder (`tests/bruno`).
2. Pick an environment: **Production** (preview URL) or **Local** (localhost:8001).
3. Enable Bruno's cookie jar (Settings → Cookies → on). Auth is httpOnly-cookie based,
   so always run **Auth → Login Admin** (or Login Customer) first; later requests reuse the cookie.

## Environment variables
- `baseUrl` — set by environment.
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
