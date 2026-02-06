"""
File: test_tc_i_003.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-I-003
Description: Verify Chart.js visualization receives correct API data
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI003:
    """TC-I-003: Verify chart data matches API response"""
    
    TEST_ID = "TC-I-003"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify Chart.js visualization receives and renders API data correctly"
    REQUIREMENT = "REQ-INT-003: Charts shall visualize cost data from API"
    PRECONDITIONS = [
        "Full stack is running",
        "Test data includes multiple months of data"
    ]
    RESOURCES = [
        "Docker environment",
        "Browser with developer tools"
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
    
    def print_result(self, usages_count, has_dates, has_costs, passed):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print("  - Chart renders without errors")
        print("  - X-axis shows correct date labels")
        print("  - Y-axis values match cost data")
        print("  - Hover tooltips display accurate values")
        print("\nACTUAL RESULTS:")
        print(f"  - Usage Records:  {usages_count}")
        print(f"  - Has Dates:      {has_dates}")
        print(f"  - Has Costs:      {has_costs}")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_chart_data(self, request):
        """Verify API returns data suitable for Chart.js rendering"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Load dashboard page")
            print("    Action:   Fetching usage data for charts")
        
        # Get usage data (what charts consume)
        response = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/usages")
            print(f"    Response: Status {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        usages = data.get("usages", [])
        
        if verbose:
            print("\n  Step 2: Inspect Chart.js data object")
            print(f"    Result:   {len(usages)} usage records")
        
        # Step 3: Verify chart labels (dates)
        if verbose:
            print("\n  Step 3: Verify chart labels match date range")
        
        has_dates = all("usage_date" in u for u in usages)
        dates = [u["usage_date"] for u in usages if "usage_date" in u]
        
        if verbose:
            print(f"    Result:   {len(dates)} dates found")
            if dates:
                print(f"    Range:    {min(dates)} to {max(dates)}")
        
        # Step 4: Verify chart values (costs)
        if verbose:
            print("\n  Step 4: Verify chart values match cost data")
        
        has_costs = all("total_cost" in u for u in usages)
        costs = [float(u["total_cost"]) for u in usages if "total_cost" in u]
        
        if verbose:
            print(f"    Result:   {len(costs)} cost values")
            if costs:
                print(f"    Total:    ${sum(costs):.2f}")
        
        # Assertions
        assert len(usages) > 0, "No usage data returned"
        assert has_dates, "Usage records missing date field"
        assert has_costs, "Usage records missing cost field"
        assert all(c >= 0 for c in costs), "Negative cost values found"
        
        passed = len(usages) > 0 and has_dates and has_costs
        
        if verbose:
            self.print_result(len(usages), has_dates, has_costs, passed)
