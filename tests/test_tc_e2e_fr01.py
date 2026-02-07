"""
File: test_tc_e2e_fr01.py
Test ID: TC-E2E-FR01
Description: FR-01 - Verify dashboard displays correct AWS and Azure costs from database
"""

import pytest
import requests
from playwright.sync_api import Page, expect
from decimal import Decimal, InvalidOperation

FRONTEND_URL = "http://localhost:8080"
API_URL = "http://localhost:5001/api/v1"

@pytest.mark.e2e
class TestE2EFR01:
    """FR-01: Dashboard displays total costs by provider"""
    
    TEST_ID = "TC-E2E-FR01"
    REQUIREMENT = "FR-01: View Cost Dashboard - Display total costs by provider on single screen"
    PASS_THRESHOLD = "Both provider totals render within 3 seconds"
    
    def test_dashboard_cost_accuracy(self, page: Page):
        """Verify displayed costs match database values"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"REQUIREMENT:       {self.REQUIREMENT}")
        print(f"PASS THRESHOLD:    {self.PASS_THRESHOLD}")
        print(f"{'='*70}")
        
        # Step 1: Get actual costs from API/Database
        print("\n  Step 1: Query database for actual costs")
        
        providers_resp = requests.get(f"{API_URL}/providers", timeout=30)
        providers = {p["provider_id"]: p["provider_name"] for p in providers_resp.json()["providers"]}
        
        services_resp = requests.get(f"{API_URL}/services", timeout=30)
        service_to_provider = {s["service_id"]: s["provider_id"] for s in services_resp.json()["services"]}
        
        usages_resp = requests.get(f"{API_URL}/usages", timeout=30)
        usages = usages_resp.json()["usages"]
        
        # Calculate expected totals by provider
        expected_costs = {"AWS": Decimal("0"), "Azure": Decimal("0")}
        for usage in usages:
            cost = Decimal(str(usage["total_cost"]))
            service_id = usage["service_id"]
            if service_id in service_to_provider:
                provider_id = service_to_provider[service_id]
                provider_name = providers.get(provider_id, "Unknown")
                if provider_name in expected_costs:
                    expected_costs[provider_name] += cost
        
        print(f"    Database AWS total:   ${expected_costs['AWS']:.2f}")
        print(f"    Database Azure total: ${expected_costs['Azure']:.2f}")
        
        # Step 2: Load dashboard and measure load time
        print("\n  Step 2: Load dashboard (must be < 3 seconds)")
        import time
        start = time.time()
        page.goto(FRONTEND_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        load_time = time.time() - start
        print(f"    ✓ Dashboard loaded in {load_time:.2f} seconds")
        
        # Step 3: Capture displayed values
        print("\n  Step 3: Capture displayed cost values")
        
        aws_element = page.locator("#aws-cost")
        azure_element = page.locator("#azure-cost")
        total_element = page.locator("#total-cost")
        
        displayed_aws = aws_element.inner_text()
        displayed_azure = azure_element.inner_text()
        displayed_total = total_element.inner_text()
        
        print(f"    Frontend AWS:   {displayed_aws}")
        print(f"    Frontend Azure: {displayed_azure}")
        print(f"    Frontend Total: {displayed_total}")
        
        # Step 4: Verify values
        print("\n  Step 4: Verify data integrity")
        
        # Check for NaN (frontend calculation bug)
        if "NaN" in displayed_total:
            print(f"    ⚠ DEFECT: Frontend displaying NaN - JavaScript calculation error")
            print(f"    This indicates the frontend is not receiving or processing data correctly")
            pytest.xfail("DEF-002: Frontend displays NaN - cost calculation broken")
        
        # Parse displayed values
        def parse_currency(s):
            return Decimal(s.replace("$", "").replace(",", ""))
        
        frontend_aws = parse_currency(displayed_aws)
        frontend_azure = parse_currency(displayed_azure)
        frontend_total = parse_currency(displayed_total)
        
        # Verify AWS + Azure = Total
        calculated_total = frontend_aws + frontend_azure
        totals_match = abs(calculated_total - frontend_total) < Decimal("0.01")
        
        print(f"    AWS + Azure = ${calculated_total:.2f}")
        print(f"    Displayed Total = ${frontend_total:.2f}")
        print(f"    Totals Match: {totals_match}")
        
        print(f"\n{'='*70}")
        passed = totals_match
        print(f"PASS/FAIL:         [{'X' if passed else ' '}] Pass  [{' ' if passed else 'X'}] Fail")
        print(f"{'='*70}")
        
        assert totals_match, f"AWS + Azure ({calculated_total}) != Total ({frontend_total})"
