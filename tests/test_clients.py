"""
File: test_clients.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: T-003
Description: Clients endpoint test. Verifies /clients returns list of
             client records with status 'ok'.
"""

import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_clients_returns_list():
    response = requests.get(f"{BASE_URL}/clients", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("status") == "ok"
    assert isinstance(data.get("clients"), list)
