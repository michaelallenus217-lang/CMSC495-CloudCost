from flask import Blueprint

api_v1_bp = Blueprint("api_v1", __name__, url_prefix="/api/v1")

# Import route modules so they register handlers on api_v1_bp.
from backend.routes.v1 import budgets
from backend.routes.v1 import clients
from backend.routes.v1 import health
from backend.routes.v1 import invoices
from backend.routes.v1 import providers
from backend.routes.v1 import services
from backend.routes.v1 import usages