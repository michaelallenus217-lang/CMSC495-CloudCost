"""
File: health.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: Health check endpoints. Returns API status and database
             connectivity status for monitoring and testing.
"""

from sqlalchemy import text
from backend.db.session import get_db_session
from backend.api_http.responses import ok, error
from . import api_v1_bp

@api_v1_bp.get("/health")
def health():
    return ok()

@api_v1_bp.get("/health/db")
def health_db():
    db = get_db_session()
    db.execute(text("SELECT 1"))
    return ok(
        meta={"db": "connected"},
    )
