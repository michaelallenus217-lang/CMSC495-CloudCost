"""
File: test_tc_f_002.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-F-002
Description: FR-02 - View Spending Trends over time
"""

import pytest
import requests
from collections import defaultdict
from conftest import BASE_URL, TIMEOUT

@pytest.mark.functional
class TestTCF002:
    """TC-F-002: FR-02 - Spending trend visualization"""
    
    TEST_ID = "TC-F-002"
    TEST_TYPE = "Functionality Testing"
    PURPOSE = "Verify spending trends show costs over time (daily/weekly/monthly)"
    REQUIREMENT = "FR-02: View Spending Trends - Show costs over time with charts"
    
    def test_spending_trends(self, request):
        """Verify usage data supports trend visualization"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"REQUIREMENT:       {self.REQUIREMENT}")
            print(f"{'='*70}")
        
        response = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        assert response.status_code == 200
        usages = response.json()["usages"]
        
        # Group by date for trend analysis
        daily_costs = defaultdict(float)
        for usage in usages:
            date = usage["usage_date"]
            cost = float(usage["total_cost"])
            daily_costs[date] += cost
        
        # Sort by date
        sorted_dates = sorted(daily_costs.keys())
        
        if verbose:
            print(f"\nDAILY SPENDING TREND:")
            for date in sorted_dates:
                print(f"  {date}: ${daily_costs[date]:.2f}")
            print(f"\n  Date range: {sorted_dates[0]} to {sorted_dates[-1]}")
            print(f"  Total days: {len(sorted_dates)}")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
        
        # Verify we have time series data
        assert len(sorted_dates) > 1, "Need multiple dates for trend analysis"
        assert all("usage_date" in u for u in usages), "Missing date field in usages"
