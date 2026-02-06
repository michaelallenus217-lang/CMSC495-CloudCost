"""
File: test_tc_i_008.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-I-008
Description: Verify count fields match actual array lengths
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI008:
    """TC-I-008: Verify API count consistency"""
    
    TEST_ID = "TC-I-008"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify 'count' field matches actual array length in all endpoints"
    REQUIREMENT = "API Contract: count field accuracy"
    
    ENDPOINTS = [
        ("clients", "clients"),
        ("providers", "providers"),
        ("services", "services"),
        ("usages", "usages"),
        ("invoices", "invoices"),
        ("budgets", "budgets"),
    ]
    
    def test_count_consistency(self, request):
        """Verify count matches array length for all endpoints"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}\n")
        
        mismatches = []
        
        for endpoint, array_key in self.ENDPOINTS:
            resp = requests.get(f"{BASE_URL}/{endpoint}", timeout=TIMEOUT)
            if resp.status_code == 200:
                data = resp.json()
                count = data.get("count", -1)
                actual = len(data.get(array_key, []))
                
                if verbose:
                    match = "✓" if count == actual else "✗"
                    print(f"  {match} /{endpoint}: count={count}, actual={actual}")
                
                if count != actual and count != -1:
                    mismatches.append((endpoint, count, actual))
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [{'X' if not mismatches else ' '}] Pass  [{' ' if not mismatches else 'X'}] Fail")
            print(f"{'='*70}")
        
        assert not mismatches, f"Count mismatches: {mismatches}"
