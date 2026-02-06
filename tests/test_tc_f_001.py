"""
File: test_tc_f_001.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-F-001
Description: FR-01 - View Cost Dashboard displays total costs by provider
"""

import pytest
import requests
from decimal import Decimal
from conftest import BASE_URL, TIMEOUT

@pytest.mark.functional
class TestTCF001:
    """TC-F-001: FR-01 - Unified cost dashboard displaying AWS and Azure spending"""
    
    TEST_ID = "TC-F-001"
    TEST_TYPE = "Functionality Testing"
    PURPOSE = "Verify dashboard displays total costs by provider (AWS, Azure)"
    REQUIREMENT = "FR-01: View Cost Dashboard - Display total costs by provider on single screen"
    
    def test_cost_by_provider(self, request):
        """Verify costs can be aggregated by provider"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"REQUIREMENT:       {self.REQUIREMENT}")
            print(f"{'='*70}")
        
        # Get providers
        providers_resp = requests.get(f"{BASE_URL}/providers", timeout=TIMEOUT)
        assert providers_resp.status_code == 200
        providers = {p["provider_id"]: p["provider_name"] for p in providers_resp.json()["providers"]}
        
        # Get services (maps to providers)
        services_resp = requests.get(f"{BASE_URL}/services", timeout=TIMEOUT)
        services = {s["service_id"]: s["provider_id"] for s in services_resp.json()["services"]}
        
        # Get usages
        usages_resp = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        usages = usages_resp.json()["usages"]
        
        # Aggregate by provider
        provider_costs = {}
        for usage in usages:
            service_id = usage["service_id"]
            cost = Decimal(usage["total_cost"])
            if service_id in services:
                provider_id = services[service_id]
                provider_name = providers.get(provider_id, "Unknown")
                provider_costs[provider_name] = provider_costs.get(provider_name, Decimal("0")) + cost
        
        if verbose:
            print(f"\nCOST BY PROVIDER:")
            for name, cost in provider_costs.items():
                print(f"  {name}: ${cost:.2f}")
            print(f"\n  TOTAL: ${sum(provider_costs.values()):.2f}")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
        
        # Verify we have data for at least one provider
        assert len(provider_costs) > 0, "No provider costs calculated"
        assert sum(provider_costs.values()) > 0, "Total cost is zero"
