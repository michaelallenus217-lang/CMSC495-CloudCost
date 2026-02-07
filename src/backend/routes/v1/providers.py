"""
File: providers.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Providers API endpoint. Returns cloud provider records
             (AWS, Azure, Google Cloud).
"""

from flask import jsonify, request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagingSchema
from backend.api_http.responses import ok

@api_v1_bp.get("/providers")
def get_providers():
    args = cast(dict[str, int], PagingSchema().load(request.args))
    limit = args["limit"]

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT TOP (:limit) ProviderID, ProviderName
            FROM Providers
            """
        ),
        {"limit": limit},
    ).fetchall()

    providers = []
    for provider_id, provider_name in rows:
        providers.append(
            {
                "provider_id": provider_id,
                "provider_name": provider_name
            }
        )

    return jsonify({"status": "ok", "count": len(providers), "providers": providers})


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
        return jsonify({"error": "Provider not found", "provider_id": provider_id}), 404

    item = {
        "provider_id": row.ProviderID,
        "provider_name": row.ProviderName,
    }
    return jsonify(item)