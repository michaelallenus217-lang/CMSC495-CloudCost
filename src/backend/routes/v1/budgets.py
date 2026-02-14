"""
File: budgets.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Budgets API endpoint. Returns budget records for cost tracking
             and threshold monitoring.
"""

from flask import request
from sqlalchemy import text
from typing import cast, Any
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema, BudgetPatchSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing, error_bad_request

@api_v1_bp.get("/budgets")
def get_budgets():
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
            ORDER BY BudgetID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
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


@api_v1_bp.get("/budgets/<int:budget_id>")
def get_budget(budget_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT BudgetID, ClientID, BudgetAmount, MonthlyLimit, AlertThreshold, AlertEnabled, CreatedDate
            FROM Budgets
            WHERE BudgetID = :budget_id
        """),
        {"budget_id": budget_id},
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


@api_v1_bp.patch("/budgets/<int:budget_id>")
def patch_budget(budget_id: int):
    payload = request.get_json(silent=True)
    if payload is None or not isinstance(payload, dict):
        return error_bad_request("Invalid JSON body (expected an object).")

    patch = cast(dict[str, Any], BudgetPatchSchema().load(payload, partial=True))

    db = get_db_session()

    # Ensure resource exists
    exists = db.execute(
        text("SELECT 1 FROM Budgets WHERE BudgetID = :budget_id"),
        { "budget_id": budget_id },
    ).fetchone()
    if exists is None:
        return error_resource_missing("budget", budget_id)

    # Attempt to update budget if new data was provided
    if patch:
        field_to_column = {
            "alert_enabled": "AlertEnabled",
            "alert_threshold": "AlertThreshold",
            "budget_amount": "BudgetAmount",
            "monthly_limit": "MonthlyLimit",
        }

        set_sql = ", ".join(f"{field_to_column[k]} = :{k}" for k in patch.keys())

        db.execute(
            text(f"UPDATE Budgets SET {set_sql} WHERE BudgetID = :budget_id"),
            { "budget_id": budget_id, **patch },
        )
        db.commit()

    # Get current budget and return
    row = db.execute(
        text("""
            SELECT BudgetID, ClientID, BudgetAmount, MonthlyLimit, AlertThreshold, AlertEnabled, CreatedDate
            FROM Budgets
            WHERE BudgetID = :budget_id
        """),
        {"budget_id": budget_id},
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