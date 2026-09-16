import asyncio
import logging
import os
import re
import smtplib
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any, Protocol
from zoneinfo import ZoneInfo

from pymongo.errors import DuplicateKeyError

logger = logging.getLogger(__name__)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
NOTIFICATION_TIMEZONE = ZoneInfo("Asia/Kolkata")


class EmailProvider(Protocol):
    enabled: bool

    async def send(self, recipient: str, subject: str, body: str) -> None: ...


class SmtpEmailProvider:
    def __init__(self) -> None:
        self.host = os.environ.get("SMTP_HOST", "").strip()
        self.port = int(os.environ.get("SMTP_PORT", "587"))
        self.username = os.environ.get("SMTP_USERNAME", "").strip()
        self.password = os.environ.get("SMTP_PASSWORD", "")
        self.sender = os.environ.get("SMTP_FROM", "").strip()
        self.use_tls = os.environ.get("SMTP_USE_TLS", "true").lower() == "true"
        self.enabled = bool(self.host and self.username and self.password and self.sender)
        if not self.enabled:
            logger.warning("Email notifications disabled: configure SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM")

    async def send(self, recipient: str, subject: str, body: str) -> None:
        if not self.enabled:
            return

        def deliver() -> None:
            message = EmailMessage()
            message["From"] = self.sender
            message["To"] = recipient
            message["Subject"] = subject
            message.set_content(body)
            with smtplib.SMTP(self.host, self.port, timeout=20) as smtp:
                if self.use_tls:
                    smtp.starttls()
                if self.username:
                    smtp.login(self.username, self.password)
                smtp.send_message(message)

        await asyncio.to_thread(deliver)


@dataclass
class NotificationPayload:
    kind: str
    reference: str
    event_id: str = ""
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    created_at: Any = None
    items: list[dict[str, Any]] = field(default_factory=list)
    amount: Any = None
    status: str = ""
    previous_status: str = ""
    notes: str = ""
    link: str = ""


class NotificationService:
    def __init__(self, collection: Any, email: EmailProvider | None = None) -> None:
        self.collection = collection
        self.email = email or SmtpEmailProvider()
        self.enabled = os.environ.get("NOTIFICATIONS_ENABLED", "true").lower() == "true"
        self.admin_email = os.environ.get("ADMIN_EMAIL", "").strip()
        self.max_attempts = max(1, int(os.environ.get("NOTIFICATION_MAX_ATTEMPTS", "3")))
        if not _valid_email(self.admin_email):
            logger.warning("Admin email notification recipient is missing or invalid")

    async def notify_new_order(self, payload: NotificationPayload) -> None:
        await self._notify("new_order", payload, include_admin=True)

    async def notify_new_quote(self, payload: NotificationPayload) -> None:
        await self._notify("new_quote", payload, include_admin=True)

    async def notify_order_status(self, payload: NotificationPayload) -> None:
        await self._notify("order_status", payload)

    async def notify_quote_status(self, payload: NotificationPayload) -> None:
        await self._notify("quote_status", payload)

    async def _notify(self, event: str, payload: NotificationPayload, include_admin: bool = False) -> None:
        if not self.enabled:
            return
        recipients = [payload.customer_email]
        if include_admin:
            recipients.append(self.admin_email)
        for recipient_index, email in enumerate(recipients):
            is_admin = include_admin and recipient_index == 1
            subject, email_body = render_notification(event, payload, is_admin=is_admin)
            recipient_label = "admin" if is_admin else "customer"
            transition = ""
            if event in {"order_status", "quote_status"}:
                transition = f":{payload.event_id or f'{payload.previous_status}:{payload.status}'}"
            if _valid_email(email) and self.email.enabled:
                email = email.strip()
                logger.info("Sending %s email for %s to %s", event, recipient_label, email)
                await self._deliver(event, payload.reference, "email", email, lambda: self.email.send(email, subject, email_body), transition)
            else:
                logger.warning("Skipping %s email for %s: invalid recipient or SMTP disabled", event, recipient_label)

    async def _deliver(self, event: str, reference: str, channel: str, recipient: str, send, transition: str = "") -> None:
        key = f"{event}:{reference}:{channel}:{recipient.lower()}{transition}"
        try:
            await self.collection.insert_one({"delivery_key": key, "created_at": datetime.now(timezone.utc)})
        except DuplicateKeyError:
            existing = await self.collection.find_one({"delivery_key": key}, {"_id": 0})
            if existing and existing.get("status") == "sent":
                logger.info("Skipping duplicate notification %s", key)
                return
            logger.info("Retrying previously failed notification %s", key)
            await self.collection.update_one(
                {"delivery_key": key},
                {"$set": {"status": "retrying", "retry_started_at": datetime.now(timezone.utc)}},
            )
        for attempt in range(1, self.max_attempts + 1):
            try:
                await send()
                await self.collection.update_one({"delivery_key": key}, {"$set": {"status": "sent", "sent_at": datetime.now(timezone.utc)}})
                return
            except Exception:
                logger.exception("Notification failed: %s attempt=%s/%s", key, attempt, self.max_attempts)
                if attempt < self.max_attempts:
                    await asyncio.sleep(0.25 * (2 ** (attempt - 1)))
        await self.collection.update_one({"delivery_key": key}, {"$set": {"status": "failed", "failed_at": datetime.now(timezone.utc)}})


def _valid_email(value: str) -> bool:
    return bool(value and EMAIL_PATTERN.fullmatch(value.strip()))


def _display_date(value: Any) -> str:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(NOTIFICATION_TIMEZONE).strftime("%Y-%m-%d %I:%M %p IST")
    return str(value or "")


def _item_lines(items: list[dict[str, Any]]) -> str:
    lines = []
    for item in items:
        title = item.get("title", "Item")
        quantity = item.get("qty", item.get("quantity", ""))
        size = item.get("size")
        suffix = f" ({size})" if size else ""
        lines.append(f"- {title}{suffix} x {quantity}".rstrip())
    return "\n".join(lines) or "- Not provided"


def render_notification(event: str, payload: NotificationPayload, is_admin: bool = False) -> tuple[str, str]:
    is_order = payload.kind == "order"
    label = "Order" if is_order else "Quote"
    is_status = event in {"order_status", "quote_status"}
    date_line = f"Date: {_display_date(payload.created_at)}" if payload.created_at else ""
    amount_line = f"Total amount: {payload.amount}" if payload.amount is not None else ""
    items_section = ["Items:", _item_lines(payload.items)] if payload.items else []
    notes_line = f"Notes: {payload.notes}" if payload.notes else ""
    link_line = f"View in your account: {payload.link}" if payload.link and not is_admin else ""

    if is_admin and event == "new_quote":
        subject = f"New quote request received - {payload.reference}"
        body_lines = [
            "Hello Admin,",
            "",
            "A new quote request has been submitted.",
            "",
            f"Quote reference: {payload.reference}",
            f"Customer name: {payload.customer_name or 'Not provided'}",
            f"Customer email: {payload.customer_email or 'Not provided'}",
            f"Customer phone: {payload.customer_phone or 'Not provided'}",
            date_line,
            *items_section,
            notes_line,
            "",
            "Please review this request and contact the customer.",
        ]
    elif is_admin and event == "new_order":
        subject = f"New order received - {payload.reference}"
        body_lines = [
            "Hello Admin,",
            "",
            "A new order has been submitted.",
            "",
            f"Order reference: {payload.reference}",
            f"Customer name: {payload.customer_name or 'Not provided'}",
            f"Customer email: {payload.customer_email or 'Not provided'}",
            f"Customer phone: {payload.customer_phone or 'Not provided'}",
            date_line,
            f"Status: {payload.status}" if payload.status else "",
            amount_line,
            *items_section,
            notes_line,
            "",
            "Please review this order and process it accordingly.",
        ]
    elif event == "new_quote":
        subject = f"Your quote request was received - {payload.reference}"
        body_lines = [
            f"Hello {payload.customer_name or 'there'},",
            "",
            "Thank you for your quote request. We have received it and our team will review it shortly.",
            "",
            f"Quote reference: {payload.reference}",
            f"Status: {payload.status}" if payload.status else "",
            date_line,
            *items_section,
            notes_line,
            link_line,
            "",
            "Our team will contact you with pricing and availability.",
        ]
    elif event == "new_order":
        subject = f"Your order was received - {payload.reference}"
        body_lines = [
            f"Hello {payload.customer_name or 'there'},",
            "",
            "Thank you for your order. We have received it and will begin processing it shortly.",
            "",
            f"Order reference: {payload.reference}",
            f"Status: {payload.status}" if payload.status else "",
            date_line,
            amount_line,
            *items_section,
            notes_line,
            link_line,
            "",
            "We will notify you when the order status changes.",
        ]
    elif event == "quote_status":
        subject = f"Your quote status was updated to {payload.status} - {payload.reference}"
        body_lines = [
            f"Hello {payload.customer_name or 'there'},",
            "",
            "Your quote status has been updated.",
            "",
            f"Quote reference: {payload.reference}",
            f"Previous status: {payload.previous_status}",
            f"New status: {payload.status}",
            date_line,
            *items_section,
            notes_line,
            link_line,
            "",
            "Please contact us if you have any questions.",
        ]
    else:
        subject = f"Your order status was updated to {payload.status} - {payload.reference}"
        body_lines = [
            f"Hello {payload.customer_name or 'there'},",
            "",
            "Your order status has been updated.",
            "",
            f"Order reference: {payload.reference}",
            f"Previous status: {payload.previous_status}",
            f"New status: {payload.status}",
            date_line,
            amount_line,
            *items_section,
            notes_line,
            link_line,
            "",
            "Please contact us if you have any questions.",
        ]

    formatted_lines = []
    previous_blank = False
    for line in body_lines:
        is_blank = line == ""
        if is_blank and previous_blank:
            continue
        formatted_lines.append(line)
        previous_blank = is_blank
    body = "\n".join(formatted_lines).strip()
    return subject, body
