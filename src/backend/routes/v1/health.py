from flask import jsonify
from sqlalchemy import text
from backend.db.session import get_db_session
from . import api_v1_bp

@api_v1_bp.get("/health")
def health():
    return jsonify({"status": "ok"})

@api_v1_bp.get("/health/db")
def health_db():
    db = get_db_session()
    db.execute(text("SELECT 1"))
    return jsonify({"status": "ok", "db": "connected"})
