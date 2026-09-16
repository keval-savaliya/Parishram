import os
import uuid
import logging
import requests
import secrets
from pathlib import Path
from urllib.parse import urlencode
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from dotenv import load_dotenv
import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, BackgroundTasks
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
from notifications import NotificationPayload, NotificationService

load_dotenv(Path(__file__).with_name(".env"))

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
notification_service = NotificationService(db.notification_deliveries)

app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


APP_NAME = "parishram-engineering"
UPLOAD_ROOT = Path(os.environ.get("UPLOAD_DIR", "uploads")).resolve()

def upload_path(path: str) -> Path:
    target = (UPLOAD_ROOT / path).resolve()
    try:
        target.relative_to(UPLOAD_ROOT)
    except ValueError:
        raise ValueError("Invalid upload path")
    return target

def put_object(path: str, data: bytes, content_type: str) -> dict:
    target = upload_path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"path": path, "size": len(data), "content_type": content_type}

def get_object(path: str):
    target = upload_path(path)
    return target.read_bytes(), "application/octet-stream"


# ---------------- Auth helpers ----------------

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def auth_cookie_options() -> dict:
    """Use Secure cross-site cookies in production and usable cookies on local HTTP."""
    configured = os.environ.get("COOKIE_SECURE")
    if configured is not None:
        secure = configured.strip().lower() in {"1", "true", "yes"}
    else:
        secure = (os.environ.get("FRONTEND_URL", "").strip().lower().startswith("https://"))
    return {"httponly": True, "secure": secure, "samesite": "none" if secure else "lax", "path": "/"}

def set_auth_cookies(response: Response, user_id: str, email: str):
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    options = auth_cookie_options()
    response.set_cookie("access_token", access, max_age=3600, **options)
    response.set_cookie("refresh_token", refresh, max_age=604800, **options)
    return access, refresh

async def find_user(user_id: str):
    return await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})

async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await find_user(session["user_id"])
                if user:
                    return user
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            bearer = auth_header[7:]
            bearer_session = await db.user_sessions.find_one({"session_token": bearer}, {"_id": 0})
            if bearer_session:
                expires_at = bearer_session["expires_at"]
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > datetime.now(timezone.utc):
                    user = await find_user(bearer_session["user_id"])
                    if user:
                        return user
            token = bearer
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await find_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_optional_user(request: Request):
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------- Schemas ----------------

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class OtpRequestIn(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)
    purpose: str = "login"

class OtpRegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)

class OtpVerifyIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
    password: Optional[str] = Field(default=None, min_length=6)
    purpose: str = "register"

class VariantIn(BaseModel):
    size: str
    price: float = 0
    stock_quantity: int = 0
    min_order_quantity: int = 1
    availability: str = "In Stock"

class ProductIn(BaseModel):
    title: str
    category: str
    description: str = ""
    specs: List[str] = []
    image: str = ""
    grade: str = ""
    moq: str = ""
    unit: str = "Piece"
    featured: bool = False
    is_active: bool = True
    sku: str = ""
    variants: List[VariantIn] = []

class CartItemIn(BaseModel):
    variant_id: str
    product_id: str
    title: str
    image: str = ""
    size: str = ""
    price: float = 0
    qty: int = 1

class CartSyncIn(BaseModel):
    items: List[CartItemIn]

class AddressIn(BaseModel):
    label: str = "Works"
    name: str
    phone: str = ""
    line1: str
    city: str
    state: str
    pincode: str

class OrderItemIn(BaseModel):
    variant_id: str
    product_id: str
    title: str
    size: str = ""
    qty: int = 1

class OrderIn(BaseModel):
    items: List[OrderItemIn]
    address: AddressIn
    note: str = ""

class EnquiryItem(BaseModel):
    product_id: str
    title: str
    qty: int = 1
    note: str = ""

class EnquiryIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    company: str = ""
    message: str = ""
    items: List[EnquiryItem] = []

class ContactIn(BaseModel):
    name: str
    email: EmailStr
    phone: str = ""
    subject: str = ""
    message: str

class StatusIn(BaseModel):
    status: str


def notification_payload(kind: str, document: dict, previous_status: str = "") -> NotificationPayload:
    is_order = kind == "order"
    reference = document.get("ref") or document.get("order_id") or document.get("enquiry_id") or ""
    address = document.get("address") or {}
    frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
    path = "/account"
    return NotificationPayload(
        kind=kind,
        reference=reference,
        event_id=document.get("notification_id") or "",
        customer_name=document.get("customer_name") or document.get("name") or address.get("name") or "",
        customer_email=document.get("customer_email") or document.get("email") or "",
        customer_phone=(address.get("phone") if is_order else document.get("phone")) or "",
        created_at=document.get("created_at"),
        items=document.get("items") or [],
        amount=document.get("total_amount") if is_order else None,
        status=document.get("status") or "",
        previous_status=previous_status,
        notes=document.get("note") or document.get("message") or "",
        link=f"{frontend_url}{path}" if frontend_url else "",
    )


# ---------------- Auth routes ----------------

@api_router.post("/auth/register")
async def register(data: RegisterIn, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "user_id": f"user_{uuid.uuid4().hex[:12]}",
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "customer",
        "auth_provider": "email",
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(dict(user))
    user.pop("password_hash")
    access, refresh = set_auth_cookies(response, user["user_id"], email)
    return {**user, "access_token": access, "refresh_token": refresh}

@api_router.post("/auth/login")
async def login(data: LoginIn, request: Request, response: Response):
    email = data.email.lower()
    identifier = f"{request.client.host}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until:
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if locked_until > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password_hash") or not verify_password(data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15)}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    clean = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    access, refresh = set_auth_cookies(response, user["user_id"], email)
    return {**clean, "access_token": access, "refresh_token": refresh}

@api_router.post("/auth/request-otp")
async def request_otp(data: OtpRequestIn):
    email = data.email.lower()
    if data.purpose == "register" and await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered. Use Login instead")
    if data.purpose == "reset" and not await db.users.find_one({"email": email}):
        return {"ok": True}
    now = datetime.now(timezone.utc)
    recent = await db.login_otps.find_one({"email": email, "created_at": {"$gt": now - timedelta(minutes=1)}})
    if recent:
        raise HTTPException(status_code=429, detail="Please wait before requesting another code")

    code = f"{secrets.randbelow(1_000_000):06d}"
    await db.login_otps.delete_many({"email": email})
    await db.login_otps.insert_one({
        "email": email,
        "name": getattr(data, "name", None),
        "password_hash": hash_password(data.password) if data.password else None,
        "purpose": data.purpose,
        "code_hash": hash_password(code),
        "created_at": now,
        "expires_at": now + timedelta(minutes=10),
        "attempts": 0,
    })
    if not notification_service.email.enabled:
        raise HTTPException(status_code=503, detail="Email delivery is not configured")
    await notification_service.email.send(
        email,
        "Your Parishram Engineering sign-in code",
        f"Your one-time sign-in code is: {code}\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.",
    )
    return {"ok": True}

@api_router.post("/auth/register-otp")
async def register_otp(data: OtpRegisterIn):
    return await request_otp(OtpRequestIn(email=data.email, name=data.name, password=data.password, purpose="register"))

@api_router.post("/auth/forgot-password")
async def forgot_password(data: OtpRequestIn):
    return await request_otp(OtpRequestIn(email=data.email, purpose="reset"))

@api_router.post("/auth/verify-otp")
async def verify_otp(data: OtpVerifyIn, response: Response):
    email = data.email.lower()
    otp = await db.login_otps.find_one({"email": email})
    if not otp:
        raise HTTPException(status_code=401, detail="Code expired or not requested")
    expires_at = otp["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        await db.login_otps.delete_one({"_id": otp["_id"]})
        raise HTTPException(status_code=401, detail="Code expired or not requested")
    if otp.get("attempts", 0) >= 5:
        await db.login_otps.delete_one({"_id": otp["_id"]})
        raise HTTPException(status_code=429, detail="Too many invalid attempts. Request a new code")
    if not verify_password(data.code, otp["code_hash"]):
        await db.login_otps.update_one({"_id": otp["_id"]}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=401, detail="Invalid code")

    user = await db.users.find_one({"email": email})
    purpose = otp.get("purpose", "register")
    if purpose == "register":
        if user:
            raise HTTPException(status_code=400, detail="Email already registered. Use Login instead")
        if not otp.get("password_hash"):
            raise HTTPException(status_code=400, detail="Registration password is missing")
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "name": otp.get("name") or email.split("@", 1)[0],
            "email": email,
            "role": "customer",
            "password_hash": otp["password_hash"],
            "email_verified": True,
            "auth_provider": "email",
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one(dict(user))
    elif purpose == "reset":
        if not user or not data.password:
            raise HTTPException(status_code=400, detail="A new password is required")
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(data.password), "email_verified": True}})
        user["password_hash"] = hash_password(data.password)
    else:
        raise HTTPException(status_code=400, detail="Invalid OTP purpose")

    await db.login_otps.delete_one({"_id": otp["_id"]})
    clean = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    access, refresh = set_auth_cookies(response, user["user_id"], email)
    return {**clean, "access_token": access, "refresh_token": refresh}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    options = auth_cookie_options()
    response.delete_cookie("access_token", **options)
    response.delete_cookie("refresh_token", **options)
    response.delete_cookie("session_token", **options)
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user=Depends(get_optional_user)):
    return user or {"authenticated": False}

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        try:
            body = await request.json()
            token = body.get("refresh_token")
        except Exception:
            token = None
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await find_user(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user["user_id"], user["email"])
    response.set_cookie("access_token", access, max_age=3600, **auth_cookie_options())
    return {"ok": True, "access_token": access}

def google_config():
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=503, detail="Google login is not configured")
    return client_id, client_secret, redirect_uri


def frontend_redirect(path: str) -> str:
    return f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')}{path}"


@api_router.get("/auth/google/start")
async def google_start():
    client_id, _, redirect_uri = google_config()
    state = uuid.uuid4().hex
    await db.google_oauth_states.insert_one({
        "state": state,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10),
    })
    params = urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@api_router.get("/auth/google/callback")
async def google_callback(code: Optional[str] = None, state: Optional[str] = None, error: Optional[str] = None):
    if error or not code or not state:
        return RedirectResponse(frontend_redirect("/login?google_error=cancelled"))

    client_id, client_secret, redirect_uri = google_config()
    state_doc = await db.google_oauth_states.find_one_and_delete({"state": state})
    expires_at = state_doc.get("expires_at") if state_doc else None
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if not state_doc or not expires_at or expires_at <= datetime.now(timezone.utc):
        return RedirectResponse(frontend_redirect("/login?google_error=expired"))

    token_response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if token_response.status_code != 200:
        logger.warning("Google token exchange failed: %s", token_response.text)
        return RedirectResponse(frontend_redirect("/login?google_error=exchange"))

    access_token = token_response.json().get("access_token")
    if not access_token:
        return RedirectResponse(frontend_redirect("/login?google_error=token"))
    profile_response = requests.get(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    if profile_response.status_code != 200:
        return RedirectResponse(frontend_redirect("/login?google_error=profile"))

    profile = profile_response.json()
    email = (profile.get("email") or "").lower()
    if not email or not profile.get("email_verified", False):
        return RedirectResponse(frontend_redirect("/login?google_error=email"))

    user = await db.users.find_one({"email": email})
    if not user:
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": profile.get("name") or email.split("@", 1)[0],
            "picture": profile.get("picture"),
            "role": "customer",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc),
        }
        await db.users.insert_one(dict(user))
    elif user.get("auth_provider") == "google" and profile.get("picture"):
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"picture": profile["picture"]}})

    redirect = RedirectResponse(frontend_redirect("/account"))
    set_auth_cookies(redirect, user["user_id"], email)
    return redirect


# ---------------- Products ----------------

@api_router.get("/products")
async def list_products(category: Optional[str] = None, q: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category and category != "All":
        query["category"] = category
    if featured:
        query["featured"] = True
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
    return await db.products.find(query, {"_id": 0}).to_list(200)

@api_router.get("/products/meta/categories")
async def product_categories():
    return await db.products.distinct("category")

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products")
async def create_product(data: ProductIn, admin=Depends(require_admin)):
    product = data.model_dump()
    product["product_id"] = f"pe-{uuid.uuid4().hex[:8]}"
    product["slug"] = product["product_id"]
    product["images"] = [product["image"]] if product.get("image") else []
    for v in product["variants"]:
        v["variant_id"] = f"var_{uuid.uuid4().hex[:8]}"
    product["created_at"] = datetime.now(timezone.utc)
    await db.products.insert_one(dict(product))
    product.pop("created_at", None)
    return product

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, data: ProductIn, admin=Depends(require_admin)):
    result = await db.products.update_one({"product_id": product_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"product_id": product_id}, {"_id": 0})

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin=Depends(require_admin)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ---------------- Enquiries ----------------

@api_router.post("/enquiries")
async def create_enquiry(data: EnquiryIn, request: Request, background_tasks: BackgroundTasks):
    user = await get_optional_user(request)
    doc = data.model_dump()
    doc["enquiry_id"] = f"enq_{uuid.uuid4().hex[:10]}"
    doc["ref"] = f"PE-{datetime.now(timezone.utc).strftime('%y')}-{uuid.uuid4().hex[:6].upper()}"
    doc["status"] = "Under Review"
    doc["user_id"] = user["user_id"] if user else None
    doc["created_at"] = datetime.now(timezone.utc)
    await db.enquiries.insert_one(dict(doc))
    background_tasks.add_task(notification_service.notify_new_quote, notification_payload("quote", doc))
    return {"ok": True, "ref": doc["ref"], "enquiry_id": doc["enquiry_id"]}

@api_router.get("/enquiries/mine")
async def my_enquiries(user=Depends(get_current_user)):
    return await db.enquiries.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/admin/enquiries")
async def all_enquiries(admin=Depends(require_admin)):
    return await db.enquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.patch("/admin/enquiries/{enquiry_id}")
async def update_enquiry_status(enquiry_id: str, data: StatusIn, background_tasks: BackgroundTasks, admin=Depends(require_admin)):
    enquiry = await db.enquiries.find_one({"enquiry_id": enquiry_id}, {"_id": 0})
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    previous_status = enquiry.get("status", "")
    result = await db.enquiries.update_one({"enquiry_id": enquiry_id}, {"$set": {"status": data.status}})
    if result.matched_count and previous_status != data.status:
        notification_id = f"status_{uuid.uuid4().hex}"
        await db.enquiries.update_one({"enquiry_id": enquiry_id}, {"$set": {"notification_id": notification_id}})
        enquiry["status"] = data.status
        enquiry["notification_id"] = notification_id
        background_tasks.add_task(notification_service.notify_quote_status, notification_payload("quote", enquiry, previous_status))
    return {"ok": True}

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(require_admin)):
    return {
        "products": await db.products.count_documents({}),
        "enquiries": await db.enquiries.count_documents({}),
        "pending": await db.enquiries.count_documents({"status": "Under Review"}),
        "customers": await db.users.count_documents({"role": "customer"}),
        "orders": await db.orders.count_documents({}),
    }


# ---------------- Categories ----------------

@api_router.get("/categories")
async def list_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(50)


# ---------------- Cart (server mirror of shop cart) ----------------

@api_router.get("/cart")
async def get_cart(user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return cart or {"user_id": user["user_id"], "items": []}

@api_router.post("/cart/sync")
async def sync_cart(data: CartSyncIn, user=Depends(get_current_user)):
    doc = {"user_id": user["user_id"], "items": [i.model_dump() for i in data.items], "updated_at": datetime.now(timezone.utc)}
    await db.carts.update_one({"user_id": user["user_id"]}, {"$set": doc}, upsert=True)
    return {"ok": True, "count": len(data.items)}


# ---------------- Addresses ----------------

@api_router.get("/addresses")
async def list_addresses(user=Depends(get_current_user)):
    return await db.addresses.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(50)

@api_router.post("/addresses")
async def create_address(data: AddressIn, user=Depends(get_current_user)):
    doc = data.model_dump()
    doc["address_id"] = f"addr_{uuid.uuid4().hex[:10]}"
    doc["user_id"] = user["user_id"]
    doc["created_at"] = datetime.now(timezone.utc)
    await db.addresses.insert_one(dict(doc))
    doc.pop("created_at", None)
    return doc

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, user=Depends(get_current_user)):
    await db.addresses.delete_one({"address_id": address_id, "user_id": user["user_id"]})
    return {"ok": True}


# ---------------- Orders ----------------

ORDER_STATUSES = ["Pending", "Confirmed", "Dispatched", "Delivered", "Cancelled"]

@api_router.post("/orders")
async def create_order(data: OrderIn, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    items = []
    total = 0.0
    touched = []
    for item in data.items:
        product = await db.products.find_one({"variants.variant_id": item.variant_id}, {"_id": 0})
        variant = None
        if product:
            variant = next((v for v in product.get("variants", []) if v.get("variant_id") == item.variant_id), None)
        if not product or not variant:
            raise HTTPException(status_code=400, detail=f"Variant unavailable for {item.title}")
        if variant.get("stock_quantity", 0) < item.qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['title']} ({variant['size']}) — {variant.get('stock_quantity', 0)} pcs available")
        line = item.model_dump()
        line["price"] = variant["price"]
        line["image"] = product.get("image", "")
        items.append(line)
        total += variant["price"] * item.qty
        touched.append((product["product_id"], variant["variant_id"], item.qty))
    for product_id, variant_id, qty in touched:
        product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
        variants = [
            {**v, "stock_quantity": v["stock_quantity"] - qty, "availability": "Out of Stock" if v["stock_quantity"] - qty <= 0 else "In Stock"}
            if v.get("variant_id") == variant_id else v
            for v in product["variants"]
        ]
        await db.products.update_one({"product_id": product_id}, {"$set": {"variants": variants}})
    doc = {
        "order_id": f"ord_{uuid.uuid4().hex[:10]}",
        "ref": f"PO-{datetime.now(timezone.utc).strftime('%y')}-{uuid.uuid4().hex[:6].upper()}",
        "user_id": user["user_id"],
        "customer_name": user.get("name", ""),
        "customer_email": user.get("email", ""),
        "items": items,
        "total_amount": round(total, 2),
        "address": data.address.model_dump(),
        "note": data.note,
        "status": "Pending",
        "payment_method": "Bank Transfer / UPI on Invoice",
        "created_at": datetime.now(timezone.utc),
    }
    await db.orders.insert_one(dict(doc))
    await db.carts.update_one({"user_id": user["user_id"]}, {"$set": {"items": [], "updated_at": datetime.now(timezone.utc)}})
    background_tasks.add_task(notification_service.notify_new_order, notification_payload("order", doc))
    return {"ok": True, "ref": doc["ref"], "order_id": doc["order_id"], "total_amount": doc["total_amount"]}

@api_router.get("/orders/mine")
async def my_orders(user=Depends(get_current_user)):
    return await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api_router.get("/admin/orders")
async def all_orders(admin=Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api_router.patch("/admin/orders/{order_id}")
async def update_order_status(order_id: str, data: StatusIn, background_tasks: BackgroundTasks, admin=Depends(require_admin)):
    if data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if data.status == "Cancelled" and order.get("status") != "Cancelled":
        for item in order.get("items", []):
            await db.products.update_one(
                {"variants.variant_id": item["variant_id"]},
                {"$inc": {"variants.$.stock_quantity": item["qty"]}, "$set": {"variants.$.availability": "In Stock"}},
            )
    previous_status = order.get("status", "")
    await db.orders.update_one({"order_id": order_id}, {"$set": {"status": data.status}})
    if previous_status != data.status:
        notification_id = f"status_{uuid.uuid4().hex}"
        await db.orders.update_one({"order_id": order_id}, {"$set": {"notification_id": notification_id}})
        order["status"] = data.status
        order["notification_id"] = notification_id
        background_tasks.add_task(notification_service.notify_order_status, notification_payload("order", order, previous_status))
    return {"ok": True}


# ---------------- File uploads (object storage) ----------------

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin=Depends(require_admin)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/uploads/products/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    await db.files.insert_one({
        "file_id": f"file_{uuid.uuid4().hex[:10]}",
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc),
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    if not path.startswith(f"{APP_NAME}/"):
        raise HTTPException(status_code=404, detail="File not found")
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")
    return Response(content=data, media_type=record.get("content_type") or content_type)


# ---------------- Contact ----------------

@api_router.post("/contact")
async def contact(data: ContactIn):
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc)
    await db.contact_messages.insert_one(doc)
    return {"ok": True}

@api_router.get("/")
async def root():
    return {"message": "Parishram Engineering API"}


app.include_router(api_router)

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://parishram-sage.vercel.app",
]


def get_cors_origins() -> list[str]:
    configured_origins = [
        origin.strip().rstrip("/")
        for origin in os.environ.get("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]
    if "*" in configured_origins:
        logger.warning("Ignoring wildcard CORS_ORIGINS because credentials are enabled")
        configured_origins = []
    return configured_origins or DEFAULT_CORS_ORIGINS


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=get_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Seed data ----------------

IMG = {
    "fittings": "https://images.unsplash.com/photo-1642797735471-3e90055c5ff9?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "auto": "https://images.unsplash.com/photo-1602664876866-d3b33b77756b?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "barrel": "https://images.unsplash.com/photo-1665492085149-21fcb2617dba?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "flange": "https://images.unsplash.com/photo-1666634157070-6fd830fb5672?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "cnc": "https://images.unsplash.com/photo-1624841970647-87dce8628d72?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "factory": "https://images.unsplash.com/photo-1513828742140-ccaa28f3eda0?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "weld": "https://images.unsplash.com/photo-1730584474401-5a03c6d1b2d1?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
    "qa": "https://images.unsplash.com/photo-1579107821380-a2f5df32d67f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
}

FIT = "S.S. Nipple Pipe Fittings"
AUTO = "Auto Parts"

SEED_PRODUCTS = [
    {"product_id": "ss-hex-nipple-304", "title": "S.S. Hex Nipple — 304 Grade", "category": FIT, "image": IMG["fittings"], "featured": True, "grade": "SS 304", "unit": "Piece", "moq": "100 pcs", "description": "Precision-threaded stainless steel hex nipple for high-pressure pipe joints. CNC-machined hex body for positive wrench grip and leak-proof sealing.", "specs": ['1/4" to 4" NPT / BSP threads', "SCH 40 / 80 wall", "ISO 9001:2015 certified", "Hydro-tested at 3000 PSI"]},
    {"product_id": "ss-hex-nipple-316", "title": "S.S. Hex Nipple — 316 Grade", "category": FIT, "image": IMG["fittings"], "featured": False, "grade": "SS 316", "unit": "Piece", "moq": "100 pcs", "description": "Corrosion-resistant 316 stainless hex nipple for chemical, marine and food-grade pipelines. Molybdenum-alloyed for pitting resistance.", "specs": ['1/4" to 4" NPT / BSP / BSPT', "SS 316 / 316L", "Pickled & passivated finish", "PMI tested"]},
    {"product_id": "ss-barrel-nipple", "title": "Stainless Steel Barrel Nipple", "category": FIT, "image": IMG["barrel"], "featured": True, "grade": "SS 316L", "unit": "Piece", "moq": "50 pcs", "description": "Seamless heavy-wall barrel nipple machined from solid SS316L pipe. Both-end NPT threading with burr-free chamfered edges.", "specs": ["Seamless SS316L pipe", "Heavy wall thickness", "3000 PSI rating", "Lengths 40mm – 300mm"]},
    {"product_id": "ss-reducing-nipple", "title": "S.S. Reducing Hex Nipple", "category": FIT, "image": IMG["fittings"], "featured": False, "grade": "SS 304", "unit": "Piece", "moq": "100 pcs", "description": "Step-down hex nipple for joining unequal pipe sizes without extra couplings. Single-piece forged construction.", "specs": ['1/2"×1/4" up to 4"×3"', "Forged single piece", "NPT × NPT / BSP × BSP", "EN 10204 3.1 MTC available"]},
    {"product_id": "ss-close-nipple", "title": "S.S. Close Nipple (Full Thread)", "category": FIT, "image": IMG["barrel"], "featured": False, "grade": "SS 304 / 316", "unit": "Piece", "moq": "200 pcs", "description": "Fully threaded close nipple for compact assemblies where fittings sit shoulder-to-shoulder. Uniform thread pitch along the full length.", "specs": ['1/8" to 4" sizes', "Full-length threading", "No unthreaded shoulder", "De-burred ends"]},
    {"product_id": "ss-welding-nipple", "title": "S.S. Welding Nipple (Weld-O-Let)", "category": FIT, "image": IMG["weld"], "featured": False, "grade": "SS 316", "unit": "Piece", "moq": "100 pcs", "description": "Butt-weld / socket-weld nipple for permanent pipeline joints. Bevelled weld end prepared to ASME B16.25.", "specs": ["Bevel end per ASME B16.25", "Butt-weld & socket-weld", "Dye-penetrant tested", "SS 304 / 316 / 316L"]},
    {"product_id": "ss-hose-nipple", "title": "S.S. Hose Nipple (KC Type)", "category": FIT, "image": IMG["fittings"], "featured": False, "grade": "SS 304", "unit": "Piece", "moq": "100 pcs", "description": "Serrated-tail hose nipple for secure clamp-on rubber and PVC hose connections. Deep serrations prevent blow-off under pressure.", "specs": ['1/2" to 6" hose tail', "Deep-cut serrations", "BSP male thread", "Mirror polish option"]},
    {"product_id": "ss-long-nipple", "title": "S.S. Long Barrel Nipple", "category": FIT, "image": IMG["barrel"], "featured": False, "grade": "SS 316L", "unit": "Piece", "moq": "50 pcs", "description": "Extended-length barrel nipple for insulated lines and panel-mount pass-throughs. Cut-to-length service available.", "specs": ["Up to 600mm length", "Cut-to-length service", "Thread protection caps", "SCH 40 / 80 / 160"]},
    {"product_id": "cnc-bushing", "title": "Precision CNC Automotive Bushing", "category": AUTO, "image": IMG["auto"], "featured": True, "grade": "EN8 / EN24", "unit": "Piece", "moq": "500 pcs", "description": "Turned and honed automotive bushing with ±0.01mm bore tolerance. Induction-hardened bearing surface for extended service life.", "specs": ["Tolerance ±0.01mm", "Induction hardened 50–55 HRC", "Surface finish Ra 0.4", "OEM drawing-based production"]},
    {"product_id": "machined-shaft", "title": "Machined Drive Shaft", "category": AUTO, "image": IMG["cnc"], "featured": False, "grade": "EN19", "unit": "Piece", "moq": "200 pcs", "description": "CNC-turned and ground drive shaft for transmission and steering assemblies. Dynamic balancing available on request.", "specs": ["EN19 / 4140 alloy steel", "Ground Ø tolerance h6", "Spline & keyway machining", "Magnaflux crack tested"]},
    {"product_id": "steel-flange", "title": "Machined Steel Flange", "category": AUTO, "image": IMG["flange"], "featured": True, "grade": "MS / SS 304", "unit": "Piece", "moq": "100 pcs", "description": "Lathe-machined flange to OEM automotive and industrial specs. Face, bore and bolt-circle machined in a single setup for true concentricity.", "specs": ["DIN / ANSI / JIS standards", "Single-setup machining", "Zinc / black-oxide finish", "CMM inspection report"]},
    {"product_id": "hydraulic-adapter", "title": "Hydraulic Fitting Adapter", "category": AUTO, "image": IMG["cnc"], "featured": False, "grade": "EN1A / SS 304", "unit": "Piece", "moq": "500 pcs", "description": "High-pressure hydraulic adapter for tractor, earthmover and industrial hydraulic lines. Pressure-tested to 1.5× working rating.", "specs": ["Up to 6000 PSI working", "JIC / ORFS / BSPP ports", "Zinc-nickel plating", "100% pressure tested"]},
    {"product_id": "spacer-collar", "title": "Turned Spacer Collar", "category": AUTO, "image": IMG["auto"], "featured": False, "grade": "EN8 / Brass", "unit": "Piece", "moq": "1000 pcs", "description": "High-volume turned spacer collars and distance sleeves for axle and gearbox assemblies. Consistent length tolerance across batches.", "specs": ["Length tolerance ±0.05mm", "Chamfered & de-burred", "Zinc / phosphate coating", "Batch traceability"]},
    {"product_id": "gear-blank", "title": "Gear Blank — EN8 Forged", "category": AUTO, "image": IMG["factory"], "featured": False, "grade": "EN8 Forged", "unit": "Piece", "moq": "200 pcs", "description": "Forged and pre-machined gear blanks ready for hobbing. Normalized grain structure for uniform hardening response.", "specs": ["Forged EN8 / EN353", "Normalized & proof-machined", "Ultrasonic tested", "Hobbing-ready finish"]},
    {"product_id": "pivot-pin", "title": "Hardened Pivot Pin", "category": AUTO, "image": IMG["auto"], "featured": False, "grade": "EN353", "unit": "Piece", "moq": "500 pcs", "description": "Case-hardened pivot pins for linkage, suspension and bucket joints. Centreless-ground OD with grease-groove options.", "specs": ["Case depth 0.8–1.2mm", "58–62 HRC surface", "Centreless ground", "Grease groove / cross-hole options"]},
    {"product_id": "valve-body", "title": "Machined Valve Body", "category": AUTO, "image": IMG["qa"], "featured": False, "grade": "SS 304 / CF8", "unit": "Piece", "moq": "100 pcs", "description": "Precision-bored valve bodies for fuel, air and hydraulic control valves. Leak-tested bores with lapped sealing faces.", "specs": ["Bore tolerance H7", "Lapped sealing faces", "Air-under-water leak test", "Custom porting available"]},
]

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@parishramengineering.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Parishram@123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "auth_provider": "email",
            "created_at": datetime.now(timezone.utc),
        })
        logger.info("Admin user seeded")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

FIT_SIZES = [('1/4"', 45), ('1/2"', 65), ('3/4"', 85), ('1"', 120), ('2"', 260)]
AUTO_SIZES = [("Standard", 180), ("Heavy-Duty", 260)]

def default_variants(product):
    base = FIT_SIZES if product.get("category") == FIT else AUTO_SIZES
    mult = 1.6 if "316" in product.get("grade", "") else 1.0
    try:
        moq = int(str(product.get("moq", "1")).split()[0])
    except (ValueError, IndexError):
        moq = 1
    return [
        {
            "variant_id": f"var_{uuid.uuid4().hex[:8]}",
            "size": size,
            "price": round(price * mult, 2),
            "stock_quantity": 500,
            "min_order_quantity": moq,
            "availability": "In Stock",
        }
        for size, price in base
    ]

CATEGORIES_SEED = [
    {"category_id": "cat-fittings", "name": FIT, "slug": "ss-nipple-pipe-fittings", "description": "Hex, barrel, reducing, close, welding and hose nipples in SS 304 / 316 / 316L.", "image": IMG["fittings"]},
    {"category_id": "cat-auto", "name": AUTO, "slug": "auto-parts", "description": "CNC-turned bushings, shafts, flanges, pins and hydraulic adapters to OEM drawings.", "image": IMG["auto"]},
]

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("product_id", unique=True)
    await db.carts.create_index("user_id", unique=True)
    await db.orders.create_index("user_id")
    await db.addresses.create_index("user_id")
    await db.categories.create_index("slug", unique=True)
    await db.notification_deliveries.create_index("delivery_key", unique=True)
    await seed_admin()
    if await db.categories.count_documents({}) == 0:
        await db.categories.insert_many(CATEGORIES_SEED)
        logger.info("Seeded categories")
    if await db.products.count_documents({}) == 0:
        for p in SEED_PRODUCTS:
            p["created_at"] = datetime.now(timezone.utc)
            p["variants"] = default_variants(p)
            p["images"] = [p["image"]]
            p["slug"] = p["product_id"]
            p["sku"] = f"PE-{p['product_id'][:8].upper()}"
            p["is_active"] = True
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info(f"Seeded {len(SEED_PRODUCTS)} products")
    else:
        # Migration: backfill variants / sku / slug / images on products created before the schema expansion
        async for p in db.products.find({"variants": {"$exists": False}}):
            await db.products.update_one({"_id": p["_id"]}, {"$set": {
                "variants": default_variants(p),
                "images": [p.get("image", "")],
                "slug": p.get("product_id"),
                "sku": f"PE-{p.get('product_id', '')[:8].upper()}",
                "is_active": True,
            }})
        logger.info("Product schema migration checked")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
