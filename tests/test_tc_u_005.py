"""
File: test_tc_u_005.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-U-005
Description: Verify invoice data structure matches database schema
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU005:
    """TC-U-005: Verify invoice data structure"""
    
    TEST_ID = "TC-U-005"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify invoice data structure matches schema (InvoiceID, ClientID, InvoiceDate, InvoiceAmount)"
    REQUIREMENT = "Database Schema: Invoices table"
    EXPECTED_FIELDS = ["invoice_id", "client_id", "invoice_date", "invoice_amount"]
    
    def test_invoice_structure(self, request):
        """Verify invoice records contain required fields"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        response = requests.get(f"{BASE_URL}/invoices", timeout=TIMEOUT)
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        assert len(data["data"]) > 0
        
        invoice = data["data"][0]
        missing = [f for f in self.EXPECTED_FIELDS if f not in invoice]
        
        if verbose:
            print(f"\nExpected fields: {self.EXPECTED_FIELDS}")
            print(f"Actual fields:   {list(invoice.keys())}")
            print(f"Missing fields:  {missing if missing else 'None'}")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [{'X' if not missing else ' '}] Pass  [{' ' if not missing else 'X'}] Fail")
            print(f"{'='*70}")
        
        assert not missing, f"Missing fields: {missing}"
