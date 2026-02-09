"""
File: providers.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Providers API endpoint. Returns cloud provider records
             (AWS, Azure, Google Cloud).
"""

from flask import request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

@api_v1_bp.get("/providers")
def get_providers():
    paged_args = cast(dict[str, int], PagedSchema().load(request.args))
    limit = paged_args["limit"]
    page = paged_args["page"]
    offset = (page - 1) * limit

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT ProviderID, ProviderName
            FROM Providers
            ORDER BY ProviderID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "limit": limit,
            "offset": offset,
        },
    ).fetchall()

    providers = []
    for provider_id, provider_name in rows:
        providers.append(
            {
                "provider_id": provider_id,
                "provider_name": provider_name
            }
        )

    return ok_resource_list(providers, "provider")


@api_v1_bp.get("/providers/<int:provider_id>")
def get_provider(provider_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT ProviderID, ProviderName
            FROM Providers
            WHERE ProviderID = :provider_id
        """),
        {"provider_id": provider_id},
    ).fetchone()

    if row is None:
        return error_resource_missing("provider", provider_id)

    item = {
        "provider_id": row.ProviderID,
        "provider_name": row.ProviderName,
    }
    return ok_resource(item, "provider")