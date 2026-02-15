"""
File: usages.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Usages API endpoint. Returns usage records tracking client
             consumption of cloud services and associated costs.
"""

from flask import request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema, DateRangeSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

@api_v1_bp.get("/usages")
def get_usages():
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
            WHERE (:start_date IS NULL OR UsageDate >= :start_date)
              AND (:end_date   IS NULL OR UsageDate <= :end_date)
            ORDER BY UsageDate DESC, UsageID DESC
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


@api_v1_bp.get("/usages/<int:usage_id>")
def get_usage(usage_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate
            FROM Usages
            WHERE UsageID = :usage_id
        """),
        {
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