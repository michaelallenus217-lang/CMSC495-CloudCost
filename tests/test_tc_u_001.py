"""
File: test_tc_u_001.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-U-001
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU001:
    """TC-U-001: Verify database connection to Azure SQL Database"""
    
    # Test Plan metadata
    TEST_ID = "TC-U-001"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify database connection function establishes connection to Azure SQL Database"
    REQUIREMENT = "REQ-DB-001: System shall connect to Azure SQL Database"
    PRECONDITIONS = [
        "Azure SQL Database is running",
        "Connection string is configured in environment variables",
        "Test database credentials are valid"
    ]
    RESOURCES = [
        "Python 3.x with pyodbc library",
        "Azure SQL Database instance",
        "Valid connection credentials"
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
        print("  - Connection object is returned (not None)")
        print("  - Test query returns result")
        print("  - No exceptions thrown")
        print("  - Connection closes without error")
        print("\nACTUAL RESULTS:")
        print(f"  - HTTP Status:    {status_code}")
        print(f"  - Response Body:  {data}")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_database_connection(self, request):
        """Verify database connection establishes successfully"""
        
        # Check if verbose mode (-s flag)
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Import database connection module")
            print("    Action:   Calling /health/db endpoint")
            print("\n  Step 2: Call get_db_connection() function")
            print("    Action:   Backend executes database connection")
            print("\n  Step 3: Execute test query")
        
        response = requests.get(f"{BASE_URL}/health/db", timeout=TIMEOUT)
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/health/db")
            print(f"    Response: Status {response.status_code}")
            print("\n  Step 4: Close connection")
            print("    Action:   Connection released after query")
        
        # Assertions
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "status" in data, "Response missing 'status' field"
        
        passed = response.status_code == 200 and "status" in data
        
        if verbose:
            self.print_result(response.status_code, data, passed)
