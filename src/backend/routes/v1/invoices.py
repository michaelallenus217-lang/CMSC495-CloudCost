"""
File: invoices.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Invoices API endpoint. Returns invoice records for billing
             and cost reporting.
"""

from flask import request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema, DateRangeSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

@api_v1_bp.get("/invoices")
def get_invoices():
    paged_args = cast(dict[str, int], PagedSchema().load(request.args))
    limit = paged_args["limit"]
    page = paged_args["page"]
    offset = (page - 1) * limit

    date_args = cast(dict[str, object], DateRangeSchema().load(request.args))
    start_date = date_args["start_date"]
    end_date = date_args["end_date"]

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT InvoiceID, ClientID, InvoiceDate, InvoiceAmount, CreatedDate
            FROM Invoices
            WHERE (:start_date IS NULL OR InvoiceDate >= :start_date)
              AND (:end_date   IS NULL OR InvoiceDate <= :end_date)
            ORDER BY InvoiceDate DESC, InvoiceID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "limit": limit,
            "offset": offset,
            "start_date": start_date,
            "end_date": end_date,
        },
    ).fetchall()

    invoices = []
    for invoice_id, client_id, invoice_date, invoice_amount, created_date in rows:
        invoices.append(
            {
                "invoice_id": invoice_id,
                "client_id": client_id,
                "invoice_date": invoice_date.isoformat() if invoice_date else None,
                "invoice_amount": invoice_amount,
                "created_date": created_date.isoformat() if created_date else None,
            }
        )

    return ok_resource_list(invoices, "invoice")


@api_v1_bp.get("/invoices/<int:invoice_id>")
def get_invoice(invoice_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT InvoiceID, ClientID, InvoiceDate, InvoiceAmount, CreatedDate
            FROM Invoices
            WHERE InvoiceID = :invoice_id
        """),
        {"invoice_id": invoice_id},
    ).fetchone()

    if row is None:
        return error_resource_missing("invoice", invoice_id)

    invoice = {
        "invoice_id": row.InvoiceID,
        "client_id": row.ClientID,
        "invoice_date": row.InvoiceDate.isoformat() if row.InvoiceDate else None,
        "invoice_amount": row.InvoiceAmount,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return ok_resource(invoice, "invoice")