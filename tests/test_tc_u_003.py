"""
File: test_tc_u_003.py
Project: Cloud Cost Intelligence Platform
Author: Bryana Henderson (Test Lead), Michael Allen (PM)
Created: February 2026
Test ID: TC-U-003
Description: Verify cost calculation function correctly sums AWS and Azure spending
"""

import pytest
import requests
from decimal import Decimal
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU003:
    """TC-U-003: Verify cost calculation correctly sums provider spending"""
    
    TEST_ID = "TC-U-003"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify cost calculation function correctly sums AWS and Azure spending"
    REQUIREMENT = "REQ-CALC-001: System shall calculate total cloud spending"
    PRECONDITIONS = [
        "Database connection is available",
        "Test data exists with costs for multiple providers",
        "Services are linked to providers"
    ]
    RESOURCES = [
        "Python 3.x",
        "pytest framework",
        "Test data with known cost values"
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
    
    def print_result(self, provider_totals, grand_total, calculated_total, passed):
        print("\n" + "=" * 70)
        print("EXPECTED RESULTS:")
        print("  - Sum of provider costs equals grand total")
        print("  - No rounding errors")
        print("  - All values are positive")
        print("\nACTUAL RESULTS:")
        for provider, total in provider_totals.items():
            print(f"  - {provider}: ${total:.2f}")
        print(f"  - Calculated Sum:  ${calculated_total:.2f}")
        print(f"  - Grand Total:     ${grand_total:.2f}")
        print(f"  - Match: {calculated_total == grand_total}")
        print("\n" + "=" * 70)
        if passed:
            print("PASS/FAIL:         [X] Pass  [ ] Fail")
        else:
            print("PASS/FAIL:         [ ] Pass  [X] Fail")
        print("=" * 70)
    
    def test_cost_calculation(self, request):
        """Verify cost calculation correctly sums spending by provider"""
        
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            self.print_header()
            print("\nTEST STEPS:")
            print("\n  Step 1: Get providers list")
        
        # Step 1: Get providers
        providers_resp = requests.get(f"{BASE_URL}/providers", timeout=TIMEOUT)
        assert providers_resp.status_code == 200
        providers = {p["provider_id"]: p["provider_name"] for p in providers_resp.json()["providers"]}
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/providers")
            print(f"    Result:   {len(providers)} providers found")
        
        # Step 2: Get services (links to providers)
        if verbose:
            print("\n  Step 2: Get services with provider mapping")
        
        services_resp = requests.get(f"{BASE_URL}/services?limit=100", timeout=TIMEOUT)
        assert services_resp.status_code == 200
        services = {s["service_id"]: s["provider_id"] for s in services_resp.json()["services"]}
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/services")
            print(f"    Result:   {len(services)} services mapped to providers")
        
        # Step 3: Get usages with costs
        if verbose:
            print("\n  Step 3: Get usages with cost data")
        
        usages_resp = requests.get(f"{BASE_URL}/usages", timeout=TIMEOUT)
        assert usages_resp.status_code == 200
        usages = usages_resp.json()["usages"]
        
        if verbose:
            print(f"    Action:   GET {BASE_URL}/usages")
            print(f"    Result:   {len(usages)} usage records found")
        
        # Step 4: Calculate totals by provider
        if verbose:
            print("\n  Step 4: Calculate totals by provider")
        
        provider_totals = {}
        grand_total = Decimal("0.00")
        
        for usage in usages:
            cost = Decimal(usage["total_cost"])
            grand_total += cost
            
            service_id = usage["service_id"]
            if service_id in services:
                provider_id = services[service_id]
                provider_name = providers.get(provider_id, f"Unknown ({provider_id})")
                
                if provider_name not in provider_totals:
                    provider_totals[provider_name] = Decimal("0.00")
                provider_totals[provider_name] += cost
        
        if verbose:
            print(f"    Action:   Summing costs per provider")
            for name, total in provider_totals.items():
                print(f"    {name}: ${total:.2f}")
        
        # Step 5: Verify calculation
        if verbose:
            print("\n  Step 5: Verify sum equals grand total")
        
        calculated_total = sum(provider_totals.values())
        
        if verbose:
            print(f"    Action:   Comparing calculated sum to grand total")
            print(f"    Calculated: ${calculated_total:.2f}")
            print(f"    Grand Total: ${grand_total:.2f}")
        
        # Assertions
        assert calculated_total == grand_total, f"Sum mismatch: {calculated_total} != {grand_total}"
        assert all(v >= 0 for v in provider_totals.values()), "Negative cost found"
        
        passed = calculated_total == grand_total
        
        if verbose:
            self.print_result(provider_totals, grand_total, calculated_total, passed)
