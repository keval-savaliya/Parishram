# PRD — Parishram Engineering Website & Quote-Cart Platform

## Original Problem Statement
Build a complete, modern, animated, responsive business website and ecommerce platform for Parishram Engineering — Manufacturer and Seller of All Types of Auto Parts & S.S. Nipple Pipe Fittings (India). Must feel like a legitimate, established B2B manufacturer: precision, stainless steel, engineering, reliability. High-end animated industrial design (dark kinetic hero, masked line reveals, scroll animations, marquee, glassmorphism, metallic palette with amber accent). React + FastAPI + MongoDB stack. Placeholder branding/content that can be swapped later. Sticky navbar with Get a Quote CTA.

## User Choices (confirmed)
- Enquiry/Quote cart (no online payments)
- Email/password customer accounts + Google social login (Emergent-managed)
- Admin panel for products + enquiries
- 16 seeded sample products (S.S. nipples/fittings + auto parts)

## Architecture
- Frontend: React 19, Tailwind, framer-motion (scroll reveals, masked hero lines, parallax), Lenis smooth scrolling, shadcn/ui (Sheet, Dialog), sonner toasts. Pages: Home, Products, Product Detail, About, Industries, Contact, Login, Account, Quote Cart, Admin.
- Backend: FastAPI, MongoDB (motor), JWT auth (httpOnly cookies, access+refresh), bcrypt, brute-force lockout, Emergent Google OAuth session exchange, admin seeding on startup, product seeding (16 items).
- Art direction: Swiss industrial — #090D16 dark hero, #F8FAFC body, amber #D97706 accent, Cabinet Grotesk / Inter / JetBrains Mono.

## Personas
- B2B buyer (OEM/distributor): browses catalogue, builds quote cart, submits enquiry, tracks status in account.
- Retail/small customer: enquires without login.
- Admin (owner): manages products, reviews enquiries, updates statuses.

## Implemented (July 2026)
- Kinetic hero with masked line-by-line reveal, parallax bg, stats strip; editorial marquee; category spotlight frames; featured products; numbered manifesto chapters; industries tiles; CTA band; mobile sticky CTA.
- Products catalogue (category filters + search), product detail with specs and qty add-to-quote.
- Quote cart (localStorage) + slide-over drawer + enquiry submission with per-item spec notes and reference number (PE-26-XXXXXX).
- Auth: register/login (JWT cookies), Google login (Emergent OAuth), logout, /me, refresh.
- Account dashboard: enquiry history with status badges (Under Review / Estimate Ready / Approved / Closed).
- Admin at /admin: stats, products add/edit/delete, enquiries inbox with status updates.
- Contact form → stored enquiries. Placeholder logo (marked), placeholder Rajkot contact details.
- Tested: full API chain (admin login, register, enquiry, admin views, 403 guard), UI flows via screenshots.

## Credentials
- Admin: admin@parishramengineering.com / Parishram@123 (see /app/memory/test_credentials.md)

## Implemented (July 2026) — Phase 2: Plan alignment (MongoDB, no Postgres)
User supplied DEPENDENCY-MAP / DEVELOPMENT-PLAN / GAP-ANALYSIS / HLD / SCHEMA-INVENTORY docs; schema inventory mapped to MongoDB collections:
- categories collection (seeded: fittings + auto parts) with slugs
- products extended: variants[] (size, price, stock_quantity, min_order_quantity, availability), sku, slug, is_active, images[]; startup migration backfills existing docs
- carts collection (server mirror via POST /api/cart/sync on login)
- addresses collection (CRUD, per user)
- orders collection: checkout flow with server-side price resolution from variants, ref PO-YY-XXXXXX, payment "Bank Transfer / UPI on Invoice", statuses Pending/Confirmed/Dispatched/Delivered/Cancelled
- Frontend: product detail variant selector with live price, Add to Cart + Add to Quote dual CTAs, /cart page with order summary + address checkout (login-gated), account tabs (Quotes / Orders / Addresses), admin Orders tab with status management, admin product form with variants editing, floating WhatsApp CTA (placeholder number), /calculator pipe spec tool (weight kg/m + burst/working PSI via Barlow) that sends specs into the quote form
- Tested: full order chain via curl (sync cart → address → order ₹9,000 → admin status change → customer sees Confirmed), UI flows screenshotted (detail variants, cart, calculator)

## Implemented (July 2026) — Stock management
- Orders decrement variant stock server-side with validation; overselling blocked with clear 400 message
- Availability auto-flips to "Out of Stock" at zero; variant chips disabled/struck-through in UI, live stock counts shown; Add to Cart guarded
- Admin cancelling an order restores stock automatically
- Demo: ss-hex-nipple-316 2" variant set to 0 stock to show the OOS state
- WhatsApp button + phone placeholders now use the real business number +91 90235 36905

## Backlog
- P0: Replace placeholder logo, images, phone/email/GSTIN with real business data; real product photos per SKU.
- P1: Pipe spec calculator (weight kg/m + burst pressure → append to quote cart); email notification on enquiry (Resend); PDF quotation download.
- P2: WhatsApp enquiry deep-link; product image upload via object storage; multi-image galleries; order/inventory module; blog/SEO pages.
