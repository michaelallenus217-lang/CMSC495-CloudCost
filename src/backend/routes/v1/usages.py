"""
File: usages.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Usages API endpoint. Returns usage records tracking client
             consumption of cloud services and associated costs.
"""

from flask import jsonify, request
from sqlalchemy import text
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp

@api_v1_bp.get("/usages")
def get_usages():
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
            SELECT TOP (:limit) UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate
            FROM Usages
            ORDER BY CreatedDate DESC
            """
        ),
        {"limit": limit},
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

    return jsonify({"status": "ok", "count": len(usages), "usages": usages})


@api_v1_bp.get("/usages/<int:usage_id>")
def get_usage(usage_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate
            FROM Usages
            WHERE UsageID = :usage_id
        """),
        {"usage_id": usage_id},
    ).fetchone()

    if row is None:
        return jsonify({"error": "Usage not found", "usage_id": usage_id}), 404

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
    return jsonify(item)