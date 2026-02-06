"""
File: conftest.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Description: Shared test fixtures. Provides API base URL, database warmup
             routine for Azure SQL cold start, and JSON response assertions.
"""

import pytest
import requests
import time
import os

BASE_URL = os.getenv("TEST_API_URL", "http://localhost:5000/api/v1")
TIMEOUT = 30

@pytest.fixture(scope="session")
def api_base():
    return BASE_URL

@pytest.fixture(scope="session", autouse=True)
def warmup_db():
    """Wake up Azure SQL before tests run."""
    for attempt in range(3):
        try:
            requests.get(f"{BASE_URL}/health", timeout=30)
            return
        except:
            time.sleep(10)

def assert_json_response(response: requests.Response):
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type.lower()

# Register custom markers
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "functional: Functionality tests")
    config.addinivalue_line("markers", "performance: Performance tests")
    config.addinivalue_line("markers", "stress: Stress tests")
    config.addinivalue_line("markers", "acceptance: Acceptance tests")
