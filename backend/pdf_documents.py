from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, KeepTogether, LongTable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

COMPANY_NAME = "Parishram Engineering"
COMPANY_TAGLINE = "Manufacturer & Supplier of Auto Parts & S.S. Nipple Pipe Fittings"
COMPANY_ADDRESS = "SIDC Rd, Veraval, Gujarat - 360024, India"
COMPANY_PHONE = "+91 99799 98408"
COMPANY_EMAIL = "kpsavaliya1@gmail.com"
BRAND_BLUE = colors.HexColor("#1287ec")
DARK = colors.HexColor("#0b0f19")
MUTED = colors.HexColor("#64748b")
LINE = colors.HexColor("#dbe3ec")
LIGHT_BLUE = colors.HexColor("#eef7ff")
LOGO_PATH = Path(__file__).resolve().parent.parent / "frontend" / "public" / "logo.png"


def _date(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%d %b %Y")
    if value:
        return str(value)[:10]
    return "-"


def _money(value: Any) -> str:
    if value is None:
        return "-"
    return "Rs. {:,.2f}".format(float(value))


def _text(value: Any, fallback: str = "-") -> str:
    return str(value).strip() if value not in (None, "") else fallback


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle("PdfBody", parent=base["BodyText"], fontName="Helvetica", fontSize=8.5, leading=11, textColor=DARK),
        "small": ParagraphStyle("PdfSmall", parent=base["BodyText"], fontName="Helvetica", fontSize=7.5, leading=8.5, textColor=MUTED),
        "label": ParagraphStyle("PdfLabel", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=MUTED, uppercase=True),
        "value": ParagraphStyle("PdfValue", parent=base["BodyText"], fontName="Helvetica", fontSize=8.5, leading=11, textColor=DARK),
        "title": ParagraphStyle("PdfTitle", parent=base["Title"], fontName="Helvetica-Bold", fontSize=18, leading=21, textColor=DARK, alignment=TA_RIGHT),
        "table": ParagraphStyle("PdfTable", parent=base["BodyText"], fontName="Helvetica", fontSize=7.5, leading=9, textColor=DARK),
        "table_bold": ParagraphStyle("PdfTableBold", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7.5, leading=9, textColor=colors.white),
        "right": ParagraphStyle("PdfRight", parent=base["BodyText"], fontName="Helvetica", fontSize=8.5, leading=11, textColor=DARK, alignment=TA_RIGHT),
    }


def _p(value: Any, style: ParagraphStyle) -> Paragraph:
    return Paragraph(_text(value).replace("&", "&amp;"), style)


def _header(document: dict[str, Any], kind: str, internal: bool, styles: dict[str, ParagraphStyle]) -> list[Any]:
    title = "FORMAL QUOTATION" if kind == "quote" and document.get("quotation") else ("QUOTE REQUEST" if kind == "quote" else "ORDER CONFIRMATION")
    logo = Image(str(LOGO_PATH), width=22 * mm, height=22 * mm) if LOGO_PATH.exists() else Spacer(22 * mm, 22 * mm)
    brand = [
        Paragraph(COMPANY_NAME, ParagraphStyle("Brand", parent=styles["value"], fontName="Helvetica-Bold", fontSize=15, leading=16, textColor=DARK)),
        Paragraph(COMPANY_TAGLINE, styles["small"]),
        Paragraph(COMPANY_ADDRESS, styles["small"]),
        Paragraph(f"{COMPANY_PHONE} | {COMPANY_EMAIL}", styles["small"]),
    ]
    metadata = [
        Paragraph(title, styles["title"]),
        Paragraph("INTERNAL USE", ParagraphStyle("Internal", parent=styles["small"], alignment=TA_RIGHT, textColor=BRAND_BLUE)) if internal else Spacer(1, 1),
        Paragraph(f"Reference: {_text(document.get('ref') or document.get('order_id') or document.get('enquiry_id'))}", styles["right"]),
        Paragraph(f"Date: {_date(document.get('created_at'))}", styles["right"]),
        Paragraph(f"Status: {_text(document.get('status'))}", styles["right"]),
    ]
    table = Table([[logo, brand, metadata]], colWidths=[25 * mm, 91 * mm, 64 * mm])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.8, BRAND_BLUE),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return [table, Spacer(1, 4 * mm)]


def _party_block(document: dict[str, Any], kind: str, styles: dict[str, ParagraphStyle]) -> Table:
    customer_name = document.get("customer_name") or document.get("name")
    customer_email = document.get("customer_email") or document.get("email")
    customer_phone = document.get("customer_phone") or document.get("phone")
    company = document.get("company")
    customer_lines = [Paragraph("CUSTOMER", styles["label"]), _p(customer_name, styles["value"]), _p(customer_email, styles["small"])]
    if kind == "quote":
        customer_lines.extend([_p(company, styles["small"]), _p(customer_phone, styles["small"])])
    address = document.get("address") or {}
    address_lines = [Paragraph("DELIVERY ADDRESS" if kind == "order" else "REQUEST DETAILS", styles["label"])]
    if kind == "order":
        address_lines.extend([
            _p(address.get("name"), styles["value"]),
            _p(address.get("line1"), styles["small"]),
            _p(f"{address.get('city', '')}, {address.get('state', '')} - {address.get('pincode', '')}", styles["small"]),
            _p(address.get("phone"), styles["small"]),
        ])
    else:
        address_lines.extend([
            _p(document.get("message"), styles["value"]),
            _p("Prices are pending admin quotation.", styles["small"]),
        ])
    table = Table([[customer_lines, address_lines]], colWidths=[90 * mm, 90 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def _items_table(document: dict[str, Any], kind: str, styles: dict[str, ParagraphStyle]) -> LongTable:
    if kind == "quote":
        rows = [[
            _p("#", styles["table_bold"]),
            _p("PRODUCT NAME", styles["table_bold"]),
            _p("QUANTITY", styles["table_bold"]),
            _p("QUOTE STATUS", styles["table_bold"]),
        ]]
    else:
        rows = [[_p("#", styles["table_bold"]), _p("PRODUCT", styles["table_bold"]), _p("SIZE / SPECIFICATION", styles["table_bold"]), _p("QTY", styles["table_bold"]), _p("UNIT PRICE", styles["table_bold"]), _p("LINE TOTAL", styles["table_bold"])]]
    for index, item in enumerate(document.get("items") or [], start=1):
        if kind == "quote":
            rows.append([
                _p(index, styles["table"]),
                _p(item.get("title"), styles["table"]),
                _p(item.get("qty"), styles["table"]),
                _p(document.get("status"), styles["table"]),
            ])
            continue
        size = item.get("size") or item.get("note") or "-"
        if kind == "quote" and not item.get("price"):
            unit_price = "To be quoted"
            line_total = "Pending"
        else:
            unit_price = _money(item.get("price"))
            line_total = _money(float(item.get("price", 0)) * int(item.get("qty", 0)))
        rows.append([
            _p(index, styles["table"]),
            _p(item.get("title"), styles["table"]),
            _p(size, styles["table"]),
            _p(item.get("qty"), styles["table"]),
            _p(unit_price, styles["table"]),
            _p(line_total, styles["table"]),
        ])
    widths = [10 * mm, 100 * mm, 30 * mm, 40 * mm] if kind == "quote" else [9 * mm, 57 * mm, 42 * mm, 16 * mm, 27 * mm, 29 * mm]
    table = LongTable(rows, colWidths=widths, repeatRows=1)
    numeric_start = 2 if kind == "quote" else 3
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (numeric_start, 1), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def _totals(document: dict[str, Any], kind: str, styles: dict[str, ParagraphStyle]) -> Table:
    if kind == "quote" and not document.get("quotation"):
        rows = [[_p("PRICING", styles["label"]), _p("Pending admin quotation", styles["right"])] , [_p("NOTE", styles["label"]), _p("This document is a quote request and is not an invoice.", styles["small"])]]
    else:
        subtotal = document.get("subtotal", document.get("total_amount", 0))
        tax = document.get("tax_amount", 0)
        freight = document.get("freight_amount", 0)
        total = document.get("total_amount", float(subtotal or 0) + float(tax or 0) + float(freight or 0))
        rows = [[_p("SUBTOTAL", styles["label"]), _p(_money(subtotal), styles["right"])] , [_p("TAX", styles["label"]), _p(_money(tax), styles["right"])] , [_p("FREIGHT", styles["label"]), _p(_money(freight), styles["right"])] , [_p("TOTAL", ParagraphStyle("TotalLabel", parent=styles["label"], textColor=BRAND_BLUE)), _p(_money(total), ParagraphStyle("TotalValue", parent=styles["right"], fontName="Helvetica-Bold", textColor=BRAND_BLUE))]]
    table = Table(rows, colWidths=[35 * mm, 65 * mm], hAlign="RIGHT")
    table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("BACKGROUND", (0, -1), (-1, -1), LIGHT_BLUE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def render_pdf(document: dict[str, Any], kind: str, internal: bool = False) -> bytes:
    styles = _styles()
    output = BytesIO()
    pdf = SimpleDocTemplate(output, pagesize=A4, rightMargin=15 * mm, leftMargin=15 * mm, topMargin=15 * mm, bottomMargin=16 * mm, title=f"{COMPANY_NAME} {kind}")
    story: list[Any] = []
    story.extend(_header(document, kind, internal, styles))
    story.append(_party_block(document, kind, styles))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("REQUESTED PRODUCTS" if kind == "quote" else "ORDER ITEMS", styles["label"]))
    story.append(Spacer(1, 2 * mm))
    story.append(_items_table(document, kind, styles))
    story.append(Spacer(1, 6 * mm))
    story.append(_totals(document, kind, styles))
    if document.get("note"):
        story.extend([Spacer(1, 6 * mm), Paragraph("NOTES", styles["label"]), _p(document.get("note"), styles["body"])])
    story.extend([Spacer(1, 10 * mm), Paragraph("Thank you for choosing Parishram Engineering.", styles["small"])])

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(15 * mm, 11 * mm, A4[0] - 15 * mm, 11 * mm)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(15 * mm, 7 * mm, f"{COMPANY_NAME} | {COMPANY_PHONE} | {COMPANY_EMAIL}")
        canvas.drawRightString(A4[0] - 15 * mm, 7 * mm, f"Page {doc.page}")
        canvas.restoreState()

    pdf.build(story, onFirstPage=footer, onLaterPages=footer)
    return output.getvalue()
