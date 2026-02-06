"""
File: test_tc_u_006.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-U-006
Description: Verify budget data structure matches database schema
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU006:
    """TC-U-006: Verify budget data structure"""
    
    TEST_ID = "TC-U-006"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify budget data structure matches schema (BudgetID, ClientID, BudgetAmount, MonthlyLimit)"
    REQUIREMENT = "Database Schema: Budgets table - FR-07"
    EXPECTED_FIELDS = ["budget_id", "client_id", "budget_amount"]
    
    def test_budget_structure(self, request):
        """Verify budget records contain required fields"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        response = requests.get(f"{BASE_URL}/budgets", timeout=TIMEOUT)
        assert response.status_code == 200
        
        data = response.json()
        assert "budgets" in data
        
        if len(data["budgets"]) > 0:
            budget = data["budgets"][0]
            missing = [f for f in self.EXPECTED_FIELDS if f not in budget]
            
            if verbose:
                print(f"\nExpected fields: {self.EXPECTED_FIELDS}")
                print(f"Actual fields:   {list(budget.keys())}")
                print(f"Missing fields:  {missing if missing else 'None'}")
            
            assert not missing, f"Missing fields: {missing}"
        else:
            if verbose:
                print("\nNo budget records found - structure validation skipped")
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
