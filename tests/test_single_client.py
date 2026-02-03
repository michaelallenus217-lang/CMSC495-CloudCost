"""
File: test_single_client.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-004
Description: Single client endpoint test. Verifies /clients/{id} returns
             a single client record by ID.
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_single_client():
    response = requests.get(f"{BASE_URL}/clients/1001", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("client_id") == 1001
