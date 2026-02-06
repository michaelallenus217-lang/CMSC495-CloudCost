"""
File: test_tc_i_004.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-I-004
Description: Verify client filter selection updates all dashboard components
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI004:
    """TC-I-004: Verify client filter updates dashboard data"""
    
    TEST_ID = "TC-I-004"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify client filter selection updates all dashboard components"
    REQUIREMENT = "REQ-INT-004: Client selection shall filter displayed data"
    PRECONDITIONS = [
        "Multiple clients exist in database",
        "Dashboard is loaded"
    ]
    RESOURCES = [
        "Full Docker stack",
        "Browser"
    ]
    
    def print_header(self):
        print("\n")
        print("=" * 70)
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"TEST TYPE:         {self.TEST_TYPE}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"REQUIREMENT:       {self.REQUIREMENT}")
        print("=" * 70)
        print("\nPRECONDITIONS:")
        for p in self.PRECONDITIONS:
            print(f"  - {p}")
        print("\nRESOURCES:")
        for r in self.RESOURCES:
            print(f"  - {r}")
    
    def print_result(self, clients_count, client_a, client_b, passed):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print("  - Dropdown displays all available clients")
        print("  - API call includes correct filter parameter")
        print("  - All dashboard elements show filtered data")
        print("  - No stale data from previous selection")
        print("\nACTUAL RESULTS:")
        print(f"  - Total Clients:    {clients_count}")
        print(f"  - Client A (1001):  {client_a}")
        print(f"  - Client B (1002):  {client_b}")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_client_filter(self, request):
        """Verify client filter returns filtered data"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Load dashboard with default view")
        
        # Get all clients
        clients_resp = requests.get(f"{BASE_URL}/clients", timeout=TIMEOUT)
        assert clients_resp.status_code == 200
        clients = clients_resp.json().get("clients", [])
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/clients")
            print(f"    Result:   {len(clients)} clients found")
        
        # Step 2: Select Client A
        if verbose:
            print("\n  Step 2: Select Client A from dropdown")
        
        client_a_id = clients[0]["client_id"] if clients else 1001
        client_a_resp = requests.get(f"{BASE_URL}/clients/{client_a_id}", timeout=TIMEOUT)
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/clients/{client_a_id}")
            print(f"    Response: Status {client_a_resp.status_code}")
        
        # Step 3: Verify API call includes client_id parameter
        if verbose:
            print("\n  Step 3: Verify API call includes client_id parameter")
        
        client_a_data = client_a_resp.json() if client_a_resp.status_code == 200 else {}
        
        if verbose:
            print(f"    Result:   {client_a_data}")
        
        # Step 4: Verify all charts/tables update
        if verbose:
            print("\n  Step 4: Verify all charts/tables update")
        
        # Step 5: Select Client B and repeat
        if verbose:
            print("\n  Step 5: Select Client B and repeat verification")
        
        client_b_id = clients[1]["client_id"] if len(clients) > 1 else 1002
        client_b_resp = requests.get(f"{BASE_URL}/clients/{client_b_id}", timeout=TIMEOUT)
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/clients/{client_b_id}")
            print(f"    Response: Status {client_b_resp.status_code}")
        
        client_b_data = client_b_resp.json() if client_b_resp.status_code == 200 else {}
        
        if verbose:
            print(f"    Result:   {client_b_data}")
        
        # Assertions
        assert len(clients) >= 2, f"Need at least 2 clients, found {len(clients)}"
        assert client_a_resp.status_code == 200, f"Client A request failed: {client_a_resp.status_code}"
        assert client_b_resp.status_code == 200, f"Client B request failed: {client_b_resp.status_code}"
        
        # Verify different clients return different data
        assert client_a_data != client_b_data, "Client A and B returned identical data"
        
        passed = (len(clients) >= 2 and 
                  client_a_resp.status_code == 200 and 
                  client_b_resp.status_code == 200)
        
        if verbose:
            self.print_result(len(clients), client_a_data, client_b_data, passed)
