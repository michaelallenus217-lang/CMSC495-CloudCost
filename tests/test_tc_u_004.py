"""
File: test_tc_u_004.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-U-004
Description: Verify API handles invalid requests gracefully
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU004:
    """TC-U-004: Verify API handles invalid requests gracefully"""
    
    TEST_ID = "TC-U-004"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify API rejects invalid requests and returns appropriate errors"
    REQUIREMENT = "REQ-VAL-001: System shall validate requests and handle errors gracefully"
    PRECONDITIONS = [
        "API is running",
        "Endpoints are accessible"
    ]
    RESOURCES = [
        "Python 3.x",
        "pytest framework",
        "HTTP client"
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
    
    def print_result(self, results, passed):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print("  - Invalid endpoints return 404")
        print("  - Invalid methods return 405")
        print("  - Invalid client IDs handled gracefully")
        print("  - No server crashes (500 errors)")
        print("\nACTUAL RESULTS:")
        for test_name, status, expected in results:
            match = "✓" if status == expected else "✗"
            print(f"  {match} {test_name}: {status} (expected {expected})")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_invalid_requests(self, request):
        """Verify API handles invalid requests gracefully"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
        
        results = []
        all_passed = True
        
        # Test 1: Invalid endpoint returns 404
        if verbose:
            print("\n  Step 1: Test invalid endpoint")
            print(f"    Action:   GET {BASE_URL}/nonexistent")
        
        resp = requests.get(f"{BASE_URL}/nonexistent", timeout=TIMEOUT)
        results.append(("Invalid endpoint", resp.status_code, 404))
        if resp.status_code != 404:
            all_passed = False
        
        if verbose:
            print(f"    Result:   Status {resp.status_code}")
        
        # Test 2: Invalid method returns 405
        if verbose:
            print("\n  Step 2: Test invalid method (POST to read-only endpoint)")
            print(f"    Action:   POST {BASE_URL}/usages")
        
        resp = requests.post(f"{BASE_URL}/usages", json={"bad": "data"}, timeout=TIMEOUT)
        results.append(("Invalid method (POST)", resp.status_code, 405))
        if resp.status_code != 405:
            all_passed = False
        
        if verbose:
            print(f"    Result:   Status {resp.status_code}")
        
        # Test 3: Invalid client ID handled gracefully (not 500)
        if verbose:
            print("\n  Step 3: Test invalid client ID")
            print(f"    Action:   GET {BASE_URL}/clients/99999")
        
        resp = requests.get(f"{BASE_URL}/clients/99999", timeout=TIMEOUT)
        results.append(("Invalid client ID", resp.status_code, 404))
        # Accept 404 or 200 with empty result, but not 500
        if resp.status_code == 500:
            all_passed = False
        
        if verbose:
            print(f"    Result:   Status {resp.status_code}")
        
        # Test 4: DELETE method not allowed
        if verbose:
            print("\n  Step 4: Test DELETE method rejected")
            print(f"    Action:   DELETE {BASE_URL}/clients/1001")
        
        resp = requests.delete(f"{BASE_URL}/clients/1001", timeout=TIMEOUT)
        results.append(("DELETE rejected", resp.status_code, 405))
        if resp.status_code != 405:
            all_passed = False
        
        if verbose:
            print(f"    Result:   Status {resp.status_code}")
        
        if verbose:
            self.print_result(results, all_passed)
        
        # Assertions
        assert results[0][1] == 404, f"Invalid endpoint should return 404, got {results[0][1]}"
        assert results[1][1] == 405, f"Invalid method should return 405, got {results[1][1]}"
        assert results[2][1] != 500, f"Invalid client should not return 500"
        assert results[3][1] == 405, f"DELETE should return 405, got {results[3][1]}"
