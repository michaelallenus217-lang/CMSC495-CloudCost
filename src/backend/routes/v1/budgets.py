from flask import jsonify, request
from sqlalchemy import text
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp

@api_v1_bp.get("/budgets")
def get_budgets():
    limit_param = request.args.get("limit", "10")

    try:
        limit = int(limit_param)
    except ValueError:
        return jsonify({"error": "limit must be an integer"}), 400

    if limit < 1:
        return jsonify({"error": "limit must be >= 1"}), 400
    
    if limit > 100:
        # Don't allow limits greter than 100
        limit = 100
    

    db = get_db_session()

    rows = db.execute(
        text(
            """
            SELECT TOP (:limit) BudgetID, ClientID, BudgetAmount, MonthlyLimit, AlertThreshold, AlertEnabled, CreatedDate
            FROM Budgets
            ORDER BY CreatedDate DESC
            """
        ),
        {"limit": limit},
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

    return jsonify({"status": "ok", "count": len(budgets), "budgets": budgets})


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
        return jsonify({"error": "Budget not found", "budget_id": budget_id}), 404

    item = {
        "budget_id": row.BudgetID,
        "client_id": row.ClientID,
        "budget_amount": row.BudgetAmount,
        "monthly_limit": row.MonthlyLimit,
        "alert_threshold": row.AlertThreshold,
        "alert_enabled": row.AlertEnabled,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return jsonify(item)