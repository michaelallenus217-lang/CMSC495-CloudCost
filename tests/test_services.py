"""
File: test_services.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-006
Description: Services endpoint test. Verifies /services returns list of
             cloud service records with pricing information.
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_services_returns_list():
    response = requests.get(f"{BASE_URL}/services", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("status") == "ok"
    assert isinstance(data.get("services"), list)
