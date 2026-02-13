"""
File: test_providers.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-005
Description: Providers endpoint test. Verifies /providers returns list of
             cloud provider records (AWS, Azure, Google Cloud).
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_providers_returns_list():
    response = requests.get(f"{BASE_URL}/providers", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("status") == "ok"
    assert isinstance(data.get("data"), list)
