"""
File: clients.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Clients API endpoint. Returns client records and supports
             single client lookup by ID.
"""

from flask import request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema, DateRangeSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

@api_v1_bp.get("/clients")
def get_clients():
    paged_args = cast(dict[str, int], PagedSchema().load(request.args))
    limit = paged_args["limit"]
    page = paged_args["page"]
    offset = (page - 1) * limit

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT ClientID, ClientName, CreatedDate
            FROM Clients
            ORDER BY ClientID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "limit": limit,
            "offset": offset,
        },
    ).fetchall()

    clients = []
    for client_id, client_name, created_date in rows:
        clients.append(
            {
                "client_id": client_id,
                "client_name": client_name,
                "created_date": created_date.isoformat() if created_date else None,
            }
        )

    return ok_resource_list(clients, "client")


@api_v1_bp.get("/clients/<int:client_id>")
def get_client(client_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT ClientID, ClientName, CreatedDate
            FROM Clients
            WHERE ClientID = :client_id
        """),
        {
            "client_id": client_id
        },
    ).fetchone()

    if row is None:
        return error_resource_missing("client", client_id)

    item = {
        "client_id": row.ClientID,
        "client_name": row.ClientName,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return ok_resource(item, "client")



## Client Budgets

@api_v1_bp.get("/clients/<int:client_id>/budgets")
def get_client_budgets(client_id: int):
    paged_args = cast(dict[str, int], PagedSchema().load(request.args))
    limit = paged_args["limit"]
    page = paged_args["page"]
    offset = (page - 1) * limit

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT BudgetID, ClientID, BudgetAmount, MonthlyLimit, AlertThreshold, AlertEnabled, CreatedDate
            FROM Budgets
            WHERE ClientID = :client_id
            ORDER BY BudgetID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "client_id": client_id,
            "limit": limit,
            "offset": offset,
        },
    ).fetchall()

    budgets = []
    for budget_id, client_id, budget_amount, monthly_limit, alert_threshold, alert_enabled, created_date in rows:
        budgets.append(
            {
                "budget_id": budget_id,
                "client_id": client_id,
                "budget_amount": budget_amount,
                "monthly_limit": monthly_limit,
                "alert_threshold": alert_threshold,
                "alert_enabled": alert_enabled,
                "created_date": created_date.isoformat() if created_date else None,
            }
        )

    return ok_resource_list(budgets, "budget")


@api_v1_bp.get("/clients/<int:client_id>/budgets/<int:budget_id>")
def get_client_budget(client_id: int, budget_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT BudgetID, ClientID, BudgetAmount, MonthlyLimit, AlertThreshold, AlertEnabled, CreatedDate
            FROM Budgets
            WHERE ClientID = :client_id
              AND BudgetID = :budget_id
        """),
        {
            "client_id": client_id,
            "budget_id": budget_id
        },
    ).fetchone()

    if row is None:
        return error_resource_missing("budget", budget_id)

    item = {
        "budget_id": row.BudgetID,
        "client_id": row.ClientID,
        "budget_amount": row.BudgetAmount,
        "monthly_limit": row.MonthlyLimit,
        "alert_threshold": row.AlertThreshold,
        "alert_enabled": row.AlertEnabled,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return ok_resource(item, "budget")



## Client Invoices

@api_v1_bp.get("/clients/<int:client_id>/invoices")
def get_client_invoices(client_id: int):
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
            WHERE ClientID = :client_id
              AND (:start_date IS NULL OR InvoiceDate >= :start_date)
              AND (:end_date   IS NULL OR InvoiceDate <= :end_date)
            ORDER BY InvoiceDate DESC, InvoiceID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "client_id": client_id,
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


@api_v1_bp.get("/clients/<int:client_id>/invoices/<int:invoice_id>")
def get_client_invoice(client_id: int, invoice_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT InvoiceID, ClientID, InvoiceDate, InvoiceAmount, CreatedDate
            FROM Invoices
            WHERE ClientID = :client_id
              AND InvoiceID = :invoice_id
        """),
        {
            "client_id": client_id,
            "invoice_id": invoice_id
        },
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



## Client Usages

@api_v1_bp.get("/clients/<int:client_id>/usages")
def get_client_usages(client_id: int):
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
            SELECT UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate
            FROM Usages
            WHERE ClientID = :client_id
              AND (:start_date IS NULL OR UsageDate >= :start_date)
              AND (:end_date   IS NULL OR UsageDate <= :end_date)
            ORDER BY UsageDate DESC, UsageID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "client_id": client_id,
            "limit": limit,
            "offset": offset,
            "start_date": start_date,
            "end_date": end_date,
        },
    ).fetchall()

    usages = []
    for usage_id, client_id, service_id, usage_date, usage_time, units_used, total_cost, created_date in rows:
        usages.append(
            {
                "usage_id": usage_id,
                "client_id": client_id,
                "service_id": service_id,
                "usage_date": usage_date.isoformat() if usage_date else None,
                "usage_time": usage_time.isoformat() if usage_time else None,
                "units_used": units_used,
                "total_cost": total_cost,
                "created_date": created_date.isoformat() if created_date else None,
            }
        )

    return ok_resource_list(usages, "usage")


@api_v1_bp.get("/clients/<int:client_id>/usages/<int:usage_id>")
def get_client_usage(client_id: int, usage_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate
            FROM Usages
            WHERE ClientID = :client_id
              AND UsageID = :usage_id
        """),
        {
            "client_id": client_id,
            "usage_id": usage_id
        },
    ).fetchone()

    if row is None:
        return error_resource_missing("usage", usage_id)

    item = {
        "usage_id": row.UsageID,
        "client_id": row.ClientID,
        "service_id": row.ServiceID,
        "usage_date": row.UsageDate.isoformat() if row.UsageDate else None,
        "usage_time": row.UsageTime.isoformat() if row.UsageTime else None,
        "units_used": row.UnitsUsed,
        "total_cost": row.TotalCost,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return ok_resource(item, "usage")