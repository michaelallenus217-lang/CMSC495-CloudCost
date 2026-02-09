"""
File: clients.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Clients API endpoint. Returns client records and supports
             single client lookup by ID.
"""

from flask import request
from sqlalchemy import text
from typing import cast
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp
from backend.api_http.schemas import PagedSchema
from backend.api_http.responses import ok_resource, ok_resource_list, error_resource_missing

@api_v1_bp.get("/clients")
def get_clients():
    paged_args = cast(dict[str, int], PagedSchema().load(request.args))
    limit = paged_args["limit"]
    page = paged_args["page"]
    offset = (page - 1) * limit

    db = get_db_session()
    rows = db.execute(
        text(
            """
            SELECT ClientID, ClientName, CreatedDate
            FROM Clients
            ORDER BY ClientID DESC
            OFFSET :offset ROWS
            FETCH NEXT :limit ROWS ONLY
            """
        ),
        {
            "limit": limit,
            "offset": offset,
        },
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

    return ok_resource_list(clients, "clients")


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
        return error_resource_missing("client", client_id)

    item = {
        "client_id": row.ClientID,
        "client_name": row.ClientName,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return ok_resource(item, "client")