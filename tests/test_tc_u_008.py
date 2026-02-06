"""
File: test_tc_u_008.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-U-008
Description: Verify client data structure matches database schema
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU008:
    """TC-U-008: Verify client data structure"""
    
    TEST_ID = "TC-U-008"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify client data structure matches schema (ClientID, ClientName, CreatedDate)"
    REQUIREMENT = "Database Schema: Clients table"
    EXPECTED_FIELDS = ["client_id", "client_name", "created_date"]
    
    def test_client_structure(self, request):
        """Verify client records contain required fields"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        response = requests.get(f"{BASE_URL}/clients", timeout=TIMEOUT)
        assert response.status_code == 200
        
        data = response.json()
        assert "clients" in data
        assert len(data["clients"]) > 0
        
        client = data["clients"][0]
        missing = [f for f in self.EXPECTED_FIELDS if f not in client]
        
        if verbose:
            print(f"\nExpected fields: {self.EXPECTED_FIELDS}")
            print(f"Actual fields:   {list(client.keys())}")
            print(f"Sample client:   {client}")
        
        assert not missing, f"Missing fields: {missing}"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
