"""
File: clients.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Clients API endpoint. Returns client records and supports
             single client lookup by ID.
"""

from flask import jsonify, request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagingSchema
from backend.api_http.responses import ok

@api_v1_bp.get("/clients")
def get_clients():
    args = cast(dict[str, int], PagingSchema().load(request.args))
    limit = args["limit"]

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT TOP (:limit) ClientID, ClientName, CreatedDate
            FROM Clients
            ORDER BY CreatedDate DESC
            """
        ),
        {"limit": limit},
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

    return jsonify({"status": "ok", "count": len(clients), "clients": clients})


@api_v1_bp.get("/clients/<int:client_id>")
def get_client(client_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT ClientID, ClientName, CreatedDate
            FROM Clients
            WHERE ClientID = :client_id
        """),
        {"client_id": client_id},
    ).fetchone()

    if row is None:
        return jsonify({"error": "Client not found", "client_id": client_id}), 404

    item = {
        "client_id": row.ClientID,
        "client_name": row.ClientName,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return jsonify(item)