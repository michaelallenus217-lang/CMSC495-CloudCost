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
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp

@api_v1_bp.get("/providers")
def get_providers():
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