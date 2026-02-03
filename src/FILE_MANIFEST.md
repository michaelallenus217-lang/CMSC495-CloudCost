# Source File Manifest
**Cloud Cost Intelligence Platform**  
**Last Updated:** February 1, 2026

## Frontend (Owner: Ishan)

| File | Description |
|------|-------------|
| frontend/index.html | Main dashboard HTML structure |
| frontend/css/style.css | Dashboard styling and layout |
| frontend/js/config.js | API endpoint configuration |
| frontend/js/utils.js | Utility functions |
| frontend/js/dashboard.js | Dashboard initialization and rendering |
| frontend/js/api.js | API calls and mock data fallback |

## Backend (Owner: Sean)

| File | Description |
|------|-------------|
| backend/wsgi.py | Flask application entry point |
| backend/__init__.py | Flask app factory |
| backend/config.py | Environment configuration |
| backend/db/engine.py | SQLAlchemy engine and Azure auth |
| backend/db/session.py | Database session management |
| backend/routes/v1/health.py | Health check endpoints |
| backend/routes/v1/clients.py | Clients CRUD endpoints |
| backend/routes/v1/providers.py | Providers CRUD endpoints |
| backend/routes/v1/services.py | Services CRUD endpoints |
| backend/routes/v1/usages.py | Usages CRUD endpoints |
| backend/routes/v1/budgets.py | Budgets CRUD endpoints |
| backend/routes/v1/invoices.py | Invoices CRUD endpoints |

## Testing (Owner: Bryana)

| File | Description |
|------|-------------|
| tests/conftest.py | Shared fixtures and warmup |
| tests/test_health.py | T-001: Health endpoint test |
| tests/test_health_db.py | T-002: Database health test |
| tests/test_clients.py | T-003: Clients endpoint test |
| tests/test_single_client.py | T-004: Single client test |
| tests/test_providers.py | T-005: Providers endpoint test |
| tests/test_services.py | T-006: Services endpoint test |
| tests/test_usages.py | T-007: Usages endpoint test |
| tests/test_budgets.py | T-008: Budgets endpoint test |
| tests/test_invoices.py | T-009: Invoices endpoint test |

## Database (Owner: Tony)

| File | Description |
|------|-------------|
| database/schema.sql | Table definitions |
| database/seed_data.sql | Simulated test data |
