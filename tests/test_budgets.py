"""
File: test_budgets.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-008
Description: Budgets endpoint test. Verifies /budgets returns list of
             budget records for cost tracking and threshold monitoring.
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_budgets_returns_list():
    response = requests.get(f"{BASE_URL}/budgets", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("status") == "ok"
    assert isinstance(data.get("budgets"), list)
