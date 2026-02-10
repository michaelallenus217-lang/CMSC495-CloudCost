"""
File: services.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Services API endpoint. Returns cloud service records with
             pricing information across providers.
"""

from flask import request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

@api_v1_bp.get("/services")
def get_services():
    paged_args = cast(dict[str, int], PagedSchema().load(request.args))
    limit = paged_args["limit"]
    page = paged_args["page"]
    offset = (page - 1) * limit

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT ServiceID, ServiceName, ServiceType, ServiceCost, ProviderID, ServiceUnit, CreatedDate
            FROM Services
            ORDER BY ServiceID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "limit": limit,
            "offset": offset,
        },
    ).fetchall()

    services = []
    for service_id, service_name, service_type, service_cost, provider_id, service_unit, created_date in rows:
        services.append(
            {
                "service_id": service_id,
                "service_name": service_name,
                "service_type": service_type,
                "service_cost": service_cost,
                "provider_id": provider_id,
                "service_unit": service_unit,
                "created_date": created_date.isoformat() if created_date else None,
            }
        )

    return ok_resource_list(services, "service")


@api_v1_bp.get("/services/<int:service_id>")
def get_service(service_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT ServiceID, ServiceName, ServiceType, ServiceCost, ProviderID, ServiceUnit, CreatedDate
            FROM Services
            WHERE ServiceID = :service_id
        """),
        {"service_id": service_id},
    ).fetchone()

    if row is None:
        return error_resource_missing("service", service_id)

    item = {
        "service_id": row.ServiceID,
        "service_name":row.ServiceName,
        "service_type": row.ServiceType,
        "service_cost": row.ServiceCost,
        "provider_id": row.ProviderID,
        "service_unit": row.ServiceUnit,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return ok_resource(item, "service")