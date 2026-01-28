from flask import jsonify, request
from sqlalchemy import text
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp

@api_v1_bp.get("/clients")
def get_clients():
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