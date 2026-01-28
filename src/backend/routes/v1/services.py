from flask import jsonify, request
from sqlalchemy import text
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp

@api_v1_bp.get("/services")
def get_services():
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
            SELECT TOP (:limit) ServiceID, ServiceName, ServiceType, ServiceCost, ProviderID, ServiceUnit, CreatedDate
            FROM Services
            ORDER BY CreatedDate DESC
            """
        ),
        {"limit": limit},
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

    return jsonify({"status": "ok", "count": len(services), "services": services})


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
        return jsonify({"error": "Service not found", "service_id": service_id}), 404

    item = {
        "service_id": row.ServiceID,
        "service_name":row.ServiceName,
        "service_type": row.ServiceType,
        "service_cost": row.ServiceCost,
        "provider_id": row.ProviderID,
        "service_unit": row.ServiceUnit,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return jsonify(item)