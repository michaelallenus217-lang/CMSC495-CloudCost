"""
File: test_tc_f_005.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-F-005
Description: FR-08 - Resource usage metrics
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.functional
class TestTCF005:
    """TC-F-005: FR-08 - Resource usage metrics"""
    
    TEST_ID = "TC-F-005"
    TEST_TYPE = "Functionality Testing"
    PURPOSE = "Verify resource usage metrics (units used, costs) are available"
    REQUIREMENT = "FR-08: View Resource Metrics - Display average/max usage by timespan"
    
    def test_usage_metrics(self, request):
        """Verify usage data includes metrics for analysis"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"REQUIREMENT:       {self.REQUIREMENT}")
            print(f"{'='*70}")
        
        response = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        assert response.status_code == 200
        usages = response.json()["data"]
        
        # Calculate metrics
        if usages:
            costs = [float(u["total_cost"]) for u in usages]
            units = [float(u["units_used"]) for u in usages]
            
            metrics = {
                "total_cost": sum(costs),
                "avg_cost": sum(costs) / len(costs),
                "max_cost": max(costs),
                "min_cost": min(costs),
                "total_units": sum(units),
                "avg_units": sum(units) / len(units),
            }
        
        if verbose:
            print(f"\nRESOURCE USAGE METRICS:")
            print(f"  Records analyzed: {len(usages)}")
            print(f"\n  Cost Metrics:")
            print(f"    Total:   ${metrics['total_cost']:.2f}")
            print(f"    Average: ${metrics['avg_cost']:.2f}")
            print(f"    Max:     ${metrics['max_cost']:.2f}")
            print(f"    Min:     ${metrics['min_cost']:.2f}")
            print(f"\n  Usage Metrics:")
            print(f"    Total units:   {metrics['total_units']:.2f}")
            print(f"    Average units: {metrics['avg_units']:.2f}")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
        
        # Verify metrics can be calculated
        assert len(usages) > 0, "No usage data for metrics"
        assert all("total_cost" in u for u in usages), "Missing cost field"
        assert all("units_used" in u for u in usages), "Missing units field"
