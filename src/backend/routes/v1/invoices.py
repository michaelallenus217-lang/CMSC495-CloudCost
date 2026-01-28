from flask import jsonify, request
from sqlalchemy import text
from backend.db.session import get_db_session
from backend.routes.v1 import api_v1_bp

@api_v1_bp.get("/invoices")
def get_invoices():
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
            SELECT TOP (:limit) InvoiceID, ClientID, InvoiceDate, InvoiceAmount, CreatedDate
            FROM Invoices
            ORDER BY CreatedDate DESC
            """
        ),
        {"limit": limit},
    ).fetchall()

    invoices = []
    for invoice_id, client_id, invoice_date, invoice_amount, created_date in rows:
        invoices.append(
            {
                "invoice_id": invoice_id,
                "client_id": client_id,
                "invoice_date": invoice_date.isoformat() if invoice_date else None,
                "invoice_amount": invoice_amount,
                "created_date": created_date.isoformat() if created_date else None,
            }
        )

    return jsonify({"status": "ok", "count": len(invoices), "invoices": invoices})


@api_v1_bp.get("/invoices/<int:invoice_id>")
def get_invoice(invoice_id: int):
    db = get_db_session()

    row = db.execute(
        text("""
            SELECT InvoiceID, ClientID, InvoiceDate, InvoiceAmount, CreatedDate
            FROM Invoices
            WHERE InvoiceID = :invoice_id
        """),
        {"invoice_id": invoice_id},
    ).fetchone()

    if row is None:
        return jsonify({"error": "Invoice not found", "invoice_id": invoice_id}), 404

    item = {
        "invoice_id": row.InvoiceID,
        "client_id": row.ClientID,
        "invoice_date": row.InvoiceDate.isoformat() if row.InvoiceDate else None,
        "invoice_amount": row.InvoiceAmount,
        "created_date": row.CreatedDate.isoformat() if row.CreatedDate else None,
    }
    return jsonify(item)