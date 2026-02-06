"""
File: test_tc_i_005.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-I-005
Description: Verify invoice records link to valid clients
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI005:
    """TC-I-005: Verify invoice-client relationship integrity"""
    
    TEST_ID = "TC-I-005"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify all invoices reference valid client_ids (FK integrity)"
    REQUIREMENT = "Database Schema: Invoices.ClientID (FK) → Clients.ClientID"
    
    def test_invoice_client_integrity(self, request):
        """Verify all invoice client_ids exist in clients table"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        # Get all clients
        clients_resp = requests.get(f"{BASE_URL}/clients", timeout=TIMEOUT)
        assert clients_resp.status_code == 200
        client_ids = {c["client_id"] for c in clients_resp.json().get("clients", [])}
        
        # Get all invoices
        invoices_resp = requests.get(f"{BASE_URL}/invoices", timeout=TIMEOUT)
        assert invoices_resp.status_code == 200
        invoices = invoices_resp.json().get("invoices", [])
        
        # Check each invoice references valid client
        orphan_invoices = [i for i in invoices if i["client_id"] not in client_ids]
        
        if verbose:
            print(f"\nTotal clients:       {len(client_ids)}")
            print(f"Total invoices:      {len(invoices)}")
            print(f"Orphan invoices:     {len(orphan_invoices)}")
            if orphan_invoices:
                print(f"Invalid client_ids:  {[i['client_id'] for i in orphan_invoices[:5]]}")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [{'X' if not orphan_invoices else ' '}] Pass  [{' ' if not orphan_invoices else 'X'}] Fail")
            print(f"{'='*70}")
        
        assert not orphan_invoices, f"Found {len(orphan_invoices)} invoices with invalid client_id"
