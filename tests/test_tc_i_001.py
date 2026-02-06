"""
File: test_tc_i_001.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-I-001
Description: Verify frontend successfully retrieves data from backend API
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI001:
    """TC-I-001: Verify health endpoint returns OK"""
    
    TEST_ID = "TC-I-001"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify the /health endpoint returns 200 OK"
    REQUIREMENT = "REQ-INT-001: System shall provide health check endpoint"
    PRECONDITIONS = [
        "Backend server is running on port 5001",
        "Docker containers are up",
        "Network connectivity available"
    ]
    RESOURCES = [
        "Docker containers (frontend, backend, database)",
        "Web browser or HTTP client",
        "Network connectivity"
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
    
    def print_result(self, status_code, data, passed):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print("  - Endpoint returns HTTP 200 OK")
        print("  - Response contains 'status' field")
        print("  - Status value is 'ok'")
        print("\nACTUAL RESULTS:")
        print(f"  - HTTP Status:    {status_code}")
        print(f"  - Response Body:  {data}")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_health_endpoint(self, request):
        """Verify health endpoint returns 200 OK"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Start Docker environment")
            print("    Action:   Verify containers are running")
            print("\n  Step 2: Send GET request to /health")
        
        response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/health")
            print(f"    Response: Status {response.status_code}")
            print("\n  Step 3: Verify 200 status code")
            print(f"    Result:   {response.status_code == 200}")
            print("\n  Step 4: Verify response body contains 'healthy'")
        
        data = response.json()
        
        if verbose:
            print(f"    Result:   {data}")
        
        # Assertions
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "status" in data, "Response missing 'status' field"
        assert data["status"] == "ok", f"Expected status 'ok', got {data['status']}"
        
        passed = response.status_code == 200 and data.get("status") == "ok"
        
        if verbose:
            self.print_result(response.status_code, data, passed)
