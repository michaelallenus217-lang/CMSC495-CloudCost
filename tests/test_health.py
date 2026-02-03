"""
File: test_health.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-001
Description: Health check endpoint test. Verifies API server is running
             and responding with status 'ok'.
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_health_returns_ok():
    response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    assert response.json().get("status") == "ok"
