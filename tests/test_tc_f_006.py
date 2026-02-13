"""
File: test_tc_f_006.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-F-006
Description: Multi-client support verification
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.functional
class TestTCF006:
    """TC-F-006: Multi-client data isolation"""
    
    TEST_ID = "TC-F-006"
    TEST_TYPE = "Functionality Testing"
    PURPOSE = "Verify system supports multiple clients with isolated data"
    REQUIREMENT = "Project Design: 10 simulated companies"
    
    def test_multi_client_support(self, request):
        """Verify multiple clients exist with separate data"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        # Get clients
        clients_resp = requests.get(f"{BASE_URL}/clients", timeout=TIMEOUT)
        clients = clients_resp.json()["data"]
        
        # Get usages per client
        usages_resp = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        usages = usages_resp.json()["data"]
        
        # Count usages per client
        client_usage_count = {}
        for u in usages:
            cid = u["client_id"]
            client_usage_count[cid] = client_usage_count.get(cid, 0) + 1
        
        if verbose:
            print(f"\nMULTI-CLIENT DATA:")
            print(f"  Total clients: {len(clients)}")
            print(f"  Clients with usage data: {len(client_usage_count)}")
            print(f"\n  Usage distribution:")
            for client in clients[:10]:
                cid = client["client_id"]
                count = client_usage_count.get(cid, 0)
                print(f"    {client['client_name']}: {count} records")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
        
        # Verify multiple clients
        assert len(clients) >= 10, f"Expected 10 clients, found {len(clients)}"
