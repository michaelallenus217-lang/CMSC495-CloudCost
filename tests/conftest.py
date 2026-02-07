import os
import pytest

BASE_URL = os.environ.get("TEST_API_URL", "http://localhost:5000/api/v1")
TIMEOUT = 30

def assert_json_response(response, expected_status=200):
    """Helper to validate JSON API responses"""
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}"
    assert response.headers.get("Content-Type", "").startswith("application/json")
    return response.json()

def pytest_configure(config):
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "functional: Functionality tests")
    config.addinivalue_line("markers", "e2e: End-to-end browser tests")
