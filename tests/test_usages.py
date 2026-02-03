"""
File: test_usages.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-007
Description: Usages endpoint test. Verifies /usages returns list of
             usage records tracking client cloud consumption.
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_usages_returns_list():
    response = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("status") == "ok"
    assert isinstance(data.get("usages"), list)
