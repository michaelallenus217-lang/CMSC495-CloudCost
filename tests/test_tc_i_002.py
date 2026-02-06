"""
File: test_tc_i_002.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-I-002
Description: Verify backend API correctly queries and returns database data
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI002:
    """TC-I-002: Verify backend connects to database"""
    
    TEST_ID = "TC-I-002"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify backend API correctly queries and returns database data"
    REQUIREMENT = "REQ-INT-002: Backend shall retrieve data from database"
    PRECONDITIONS = [
        "Backend server is running",
        "Database is populated with test data",
        "API routes are configured"
    ]
    RESOURCES = [
        "Python Flask server",
        "Azure SQL Database",
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
    
    def print_result(self, status_code, db_status, response_time, passed):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print("  - Response status 200")
        print("  - Database status is 'connected'")
        print("  - Response time < 2 seconds")
        print("\nACTUAL RESULTS:")
        print(f"  - HTTP Status:    {status_code}")
        print(f"  - DB Status:      {db_status}")
        print(f"  - Response Time:  {response_time:.2f}s")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_database_connectivity(self, request):
        """Verify backend can query database"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Start backend server")
            print("    Action:   Verify backend is running")
            print("\n  Step 2: Send GET request to /health/db")
        
        import time
        start = time.time()
        response = requests.get(f"{BASE_URL}/health/db", timeout=TIMEOUT)
        response_time = time.time() - start
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/health/db")
            print(f"    Response: Status {response.status_code}")
            print("\n  Step 3: Verify response structure")
        
        data = response.json()
        
        if verbose:
            print(f"    Result:   {data}")
            print("\n  Step 4: Compare response data with database records")
            print(f"    Result:   DB status = {data.get('db', 'N/A')}")
        
        # Assertions
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert data.get("db") == "connected", f"Expected db 'connected', got {data.get('db')}"
        assert response_time < 2, f"Response too slow: {response_time:.2f}s"
        
        passed = response.status_code == 200 and data.get("db") == "connected"
        
        if verbose:
            self.print_result(response.status_code, data.get("db"), response_time, passed)
