# Auth Testing Playbook — Parishram Engineering

## Credentials
- Admin: admin@parishramengineering.com / Parishram@123 (role: admin)
- Customer test user: create via /api/auth/register

## Step 1: MongoDB verification
```
mongosh --eval "use('test_database'); db.users.find({role:'admin'}); db.products.countDocuments({})"
```
Verify: admin exists, password_hash starts with $2b$, unique indexes on users.email and users.user_id, 16 products seeded.

## Step 2: API testing
```
API=https://precision-fittings.preview.emergentagent.com
curl -c /tmp/c.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@parishramengineering.com","password":"Parishram@123"}'
curl -b /tmp/c.txt $API/api/auth/me
curl $API/api/products
curl -b /tmp/c.txt $API/api/admin/enquiries
```
Login returns user object + sets access_token/refresh_token cookies. /me returns user. /admin/enquiries returns 403 for non-admin.

## Step 3: Google OAuth (Emergent-managed)
- Login button redirects to https://auth.emergentagent.com/?redirect=<origin>/account
- After Google auth, user lands at /account#session_id=... -> AuthCallback exchanges it via POST /api/auth/google/session, session_token cookie set (7 days).
- Test: insert user + user_sessions doc in mongosh, then call GET /api/auth/me with Authorization: Bearer <session_token>.

## Step 4: Enquiry flow
```
curl -X POST $API/api/enquiries -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com","phone":"9999999999","items":[{"product_id":"ss-hex-nipple-304","title":"S.S. Hex Nipple — 304 Grade","qty":100}]}'
```
Returns {ok, ref}. Logged-in users see history at GET /api/enquiries/mine.
