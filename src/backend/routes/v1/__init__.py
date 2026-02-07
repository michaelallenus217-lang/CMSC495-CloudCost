"""
File: __init__.py
Project: Cloud Cost Intelligence Platform
Author: Sean Kellner (Backend Lead)
Created: January 2026
Description: API v1 blueprint initialization. Registers all v1 endpoint routes.
"""

from flask import Blueprint
api_v1_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")

from backend.api_http.error_handlers import register_error_handlers
register_error_handlers(api_v1_bp)

# Import route modules so they register handlers on api_v1_bp.
from backend.routes.v1 import budgets
from backend.routes.v1 import clients
from backend.routes.v1 import health
from backend.routes.v1 import invoices
from backend.routes.v1 import providers
from backend.routes.v1 import services
from backend.routes.v1 import usages