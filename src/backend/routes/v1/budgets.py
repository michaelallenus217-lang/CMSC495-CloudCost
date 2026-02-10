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
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

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