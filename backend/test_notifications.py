import asyncio
import os
from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError

from notifications import NotificationPayload, NotificationService, render_notification


class FakeCollection:
    def __init__(self):
        self.documents = {}

    async def insert_one(self, document):
        key = document["delivery_key"]
        if key in self.documents:
            raise DuplicateKeyError("duplicate")
        self.documents[key] = document

    async def update_one(self, query, update):
        self.documents[query["delivery_key"]].update(update["$set"])

    async def find_one(self, query, projection=None):
        return self.documents.get(query["delivery_key"])


class FakeEmail:
    enabled = True

    def __init__(self, fail=False):
        self.fail = fail
        self.calls = []

    async def send(self, recipient, subject, body):
        self.calls.append((recipient, subject, body))
        if self.fail:
            raise RuntimeError("email unavailable")


def payload(**overrides):
    values = {
        "kind": "order",
        "reference": "PO-26-ABC123",
        "customer_name": "Buyer",
        "customer_email": "buyer@example.com",
        "customer_phone": "+911234567890",
        "created_at": datetime.now(timezone.utc),
        "items": [{"title": "Widget", "qty": 2}],
        "amount": 100,
        "status": "Pending",
    }
    values.update(overrides)
    return NotificationPayload(**values)


def test_status_template_includes_previous_and_new_status():
    subject, body = render_notification(
        "order_status", payload(status="Confirmed", previous_status="Pending")
    )
    assert "Previous status: Pending" in body
    assert "New status: Confirmed" in body
    assert "Confirmed" in subject


def test_email_dates_are_displayed_in_india_standard_time():
    timestamp = datetime(2026, 9, 16, 12, 30, tzinfo=timezone.utc)
    subject, body = render_notification("new_quote", payload(kind="quote", created_at=timestamp))

    assert subject == "Your quote request was received - PO-26-ABC123"
    assert "Date: 2026-09-16 06:00 PM IST" in body


def test_admin_template_identifies_quote_submitter():
    subject, body = render_notification("new_quote", payload(kind="quote"), is_admin=True)

    assert subject == "New quote request received - PO-26-ABC123"
    assert "Hello Admin," in body
    assert "A new quote request has been submitted." in body
    assert "\n\nA new quote request has been submitted.\n\n" in body
    assert "Customer name: Buyer" in body
    assert "Customer email: buyer@example.com" in body
    assert "\n\n\n" not in body


def test_admin_order_template_contains_processing_details():
    subject, body = render_notification("new_order", payload(kind="order"), is_admin=True)

    assert subject == "New order received - PO-26-ABC123"
    assert "A new order has been submitted." in body
    assert "Total amount: 100" in body
    assert "Please review this order" in body


def test_customer_submission_templates_are_distinct():
    quote_subject, quote_body = render_notification("new_quote", payload(kind="quote"))
    order_subject, order_body = render_notification("new_order", payload(kind="order"))

    assert "quote request was received" in quote_subject
    assert "Thank you for your quote request" in quote_body
    assert "order was received" in order_subject
    assert "Thank you for your order" in order_body


def test_customer_status_templates_include_previous_and_new_status():
    quote_subject, quote_body = render_notification(
        "quote_status", payload(kind="quote", status="Estimate Ready", previous_status="Under Review")
    )
    order_subject, order_body = render_notification(
        "order_status", payload(kind="order", status="Dispatched", previous_status="Confirmed")
    )

    assert "quote status was updated" in quote_subject
    assert "Previous status: Under Review" in quote_body
    assert "New status: Estimate Ready" in quote_body
    assert "order status was updated" in order_subject
    assert "Previous status: Confirmed" in order_body
    assert "New status: Dispatched" in order_body


def test_new_order_notifies_customer_and_admin(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    collection = FakeCollection()
    email = FakeEmail()
    service = NotificationService(collection, email)

    asyncio.run(service.notify_new_order(payload()))

    assert {call[0] for call in email.calls} == {"buyer@example.com", "admin@example.com"}
    assert all(document["status"] == "sent" for document in collection.documents.values())


def test_new_quote_and_status_change_notify_expected_channels(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    collection = FakeCollection()
    email = FakeEmail()
    service = NotificationService(collection, email)
    quote = payload(
        kind="quote",
        reference="PE-26-QUOTE1",
        customer_phone="",
        amount=None,
        status="Under Review",
    )

    asyncio.run(service.notify_new_quote(quote))
    asyncio.run(service.notify_quote_status(
        payload(kind="quote", reference="PE-26-QUOTE1", status="Estimate Ready", previous_status="Under Review")
    ))

    assert len(email.calls) == 3
    assert any("Estimate Ready" in call[1] for call in email.calls)


def test_duplicate_delivery_is_skipped(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "")
    collection = FakeCollection()
    email = FakeEmail()
    service = NotificationService(collection, email)

    asyncio.run(service.notify_new_order(payload()))
    asyncio.run(service.notify_new_order(payload()))

    assert len(email.calls) == 1


def test_distinct_status_changes_each_notify_once(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "")
    collection = FakeCollection()
    email = FakeEmail()
    service = NotificationService(collection, email)

    asyncio.run(service.notify_order_status(payload(status="Confirmed", previous_status="Pending")))
    asyncio.run(service.notify_order_status(payload(status="Dispatched", previous_status="Confirmed")))
    asyncio.run(service.notify_order_status(payload(status="Dispatched", previous_status="Confirmed")))

    assert len(email.calls) == 2
    assert len(collection.documents) == 2


def test_invalid_customer_contacts_are_skipped(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "")
    email = FakeEmail()
    service = NotificationService(FakeCollection(), email)

    asyncio.run(service.notify_order_status(payload(customer_email="invalid", customer_phone="not-a-phone")))

    assert email.calls == []


def test_provider_failure_is_recorded_without_raising(monkeypatch):
    monkeypatch.setenv("NOTIFICATION_MAX_ATTEMPTS", "2")
    monkeypatch.setenv("ADMIN_EMAIL", "")
    collection = FakeCollection()
    email = FakeEmail(fail=True)
    service = NotificationService(collection, email)

    asyncio.run(service.notify_new_order(payload()))

    assert len(email.calls) == 2
    assert next(iter(collection.documents.values()))["status"] == "failed"


def test_failed_delivery_can_retry_for_same_status_transition(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "")
    collection = FakeCollection()
    email = FakeEmail(fail=True)
    service = NotificationService(collection, email)

    asyncio.run(service.notify_order_status(payload(status="Confirmed", previous_status="Pending")))
    email.fail = False
    asyncio.run(service.notify_order_status(payload(status="Confirmed", previous_status="Pending")))

    assert len(email.calls) == 4
    assert next(iter(collection.documents.values()))["status"] == "sent"
