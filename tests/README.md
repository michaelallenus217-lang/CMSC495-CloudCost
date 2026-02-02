# Phase I Test Suite

Automated backend tests for the Cloud Cost Intelligence Platform.

## Test Matrix

| Test ID | Test Name | Endpoint | Expected Result |
|---------|-----------|----------|-----------------|
| T-001 | test_health_returns_ok | /health | 200 OK, status='ok' |
| T-002 | test_health_db_connected | /health/db | 200 OK, status in response |
| T-003 | test_clients_returns_list | /clients | 200 OK, clients list |
| T-004 | test_single_client | /clients/1001 | 200 OK, single client object |
| T-005 | test_providers_returns_list | /providers | 200 OK, providers list |
| T-006 | test_services_returns_list | /services | 200 OK, services list |
| T-007 | test_usages_returns_list | /usages | 200 OK, usages list |
| T-008 | test_budgets_returns_list | /budgets | 200 OK, budgets list |
| T-009 | test_invoices_returns_list | /invoices | 200 OK, invoices list |

## Prerequisites
```bash
pip install pytest requests
```

## Running Tests

**Standard (port 5000):**
```bash
pytest tests/ -v
```

**ARM Mac with Docker (port 5001):**
```bash
TEST_API_URL=http://localhost:5001/api/v1 pytest tests/ -v
```

## Azure SQL Cold Start

The database may be paused when idle. The test suite includes a warmup fixture that retries the health endpoint before running tests. If tests timeout on first run, wait 60 seconds and run again.

## File Structure
```
tests/
├── README.md
├── conftest.py           # Shared fixtures and warmup
├── test_health.py        # T-001
├── test_health_db.py     # T-002
├── test_clients.py       # T-003
├── test_single_client.py # T-004
├── test_providers.py     # T-005
├── test_services.py      # T-006
├── test_usages.py        # T-007
├── test_budgets.py       # T-008
└── test_invoices.py      # T-009
```
