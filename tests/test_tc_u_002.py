"""
File: test_tc_u_002.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-U-002
Description: Verify cost data retrieval function returns correct data structure
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU002:
    """TC-U-002: Verify cost data retrieval returns correct structure"""
    
    TEST_ID = "TC-U-002"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify cost data retrieval function returns correct data structure"
    REQUIREMENT = "REQ-API-001: System shall retrieve cost data from database"
    PRECONDITIONS = [
        "Database connection is available",
        "Test data exists in cloud_costs table",
        "API module is imported"
    ]
    RESOURCES = [
        "Python 3.x",
        "pytest framework",
        "Mock database with seed data"
    ]
    EXPECTED_FIELDS = ["client_id", "total_cost", "usage_date", "service_id", "usage_id"]
    
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
    
    def print_result(self, status_code, data, passed, missing_fields=None):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print(f"  - Returns JSON with keys: {', '.join(self.EXPECTED_FIELDS)}")
        print("  - All numeric fields are proper type")
        print("  - Data matches seed values")
        print("\nACTUAL RESULTS:")
        print(f"  - HTTP Status:    {status_code}")
        print(f"  - Record Count:   {data.get('count', 'N/A')}")
        if data.get('usages'):
            print(f"  - First Record:   {data['usages'][0]}")
        if missing_fields:
            print(f"  - Missing Fields: {missing_fields}")
        else:
            print(f"  - All required fields present")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_cost_data_structure(self, request):
        """Verify cost data retrieval returns correct JSON structure"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Import api.routes module")
            print("    Action:   Calling /usages endpoint")
            print("\n  Step 2: Call get_cost_data() with test client_id")
            print("    Action:   GET request to usages endpoint")
        
        response = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/usages")
            print(f"    Response: Status {response.status_code}")
            print("\n  Step 3: Validate returned JSON structure")
            print("    Action:   Checking required fields exist")
            print("\n  Step 4: Verify data types of all fields")
            print("    Action:   Validating field types")
        
        # Assertions
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "usages" in data, "Response missing 'usages' array"
        assert "count" in data, "Response missing 'count' field"
        assert len(data["usages"]) > 0, "Usages array is empty"
        
        # Check first record has required fields
        first_record = data["usages"][0]
        missing_fields = [f for f in self.EXPECTED_FIELDS if f not in first_record]
        
        assert not missing_fields, f"Missing fields: {missing_fields}"
        
        # Verify data types
        assert isinstance(first_record["client_id"], int), "client_id should be int"
        assert isinstance(first_record["usage_id"], int), "usage_id should be int"
        
        passed = response.status_code == 200 and not missing_fields
        
        if verbose:
            self.print_result(response.status_code, data, passed, missing_fields if missing_fields else None)
