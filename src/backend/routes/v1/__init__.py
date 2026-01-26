from flask import Blueprint

api_v1_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")

# Import route modules so they register handlers on api_v1_bp.
from . import health