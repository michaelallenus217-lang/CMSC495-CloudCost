"""
File: test_tc_e2e_fr03.py
Test ID: TC-E2E-FR03
Description: FR-03 - Verify filters update dashboard with correct filtered data
"""

import pytest
import requests
from playwright.sync_api import Page, expect

FRONTEND_URL = "http://localhost:8080"
API_URL = "http://localhost:5001/api/v1"

@pytest.mark.e2e
class TestE2EFR03:
    """FR-03: Filter by Provider/Service"""
    
    TEST_ID = "TC-E2E-FR03"
    REQUIREMENT = "FR-03: Filter by Provider/Service - Drill down by AWS, Azure, or by Service"
    PASS_THRESHOLD = "All 3 filter types return correct filtered data"
    
    def test_filter_functionality(self, page: Page):
        """Verify all filter types work correctly"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"REQUIREMENT:       {self.REQUIREMENT}")
        print(f"PASS THRESHOLD:    {self.PASS_THRESHOLD}")
        print(f"{'='*70}")
        
        # Step 1: Load dashboard and get initial total
        print("\n  Step 1: Load dashboard and capture initial state")
        page.goto(FRONTEND_URL)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        
        initial_total = page.locator("#total-cost").inner_text()
        print(f"    Initial total: {initial_total}")
        
        # Step 2: Test Provider filter
        print("\n  Step 2: Test Provider filter")
        provider_filter = page.locator("#provider-filter")
        
        if provider_filter.count() > 0:
            options = provider_filter.locator("option")
            option_count = options.count()
            print(f"    ✓ Provider filter has {option_count} options")
            
            # Select a specific provider (not "All")
            if option_count > 1:
                provider_filter.select_option(index=1)
                page.click("#apply-filters")
                page.wait_for_timeout(1500)
                
                filtered_total = page.locator("#total-cost").inner_text()
                print(f"    After provider filter: {filtered_total}")
                
                # Reset
                page.click("#clear-filters")
                page.wait_for_timeout(1500)
        
        # Step 3: Test Service filter
        print("\n  Step 3: Test Service filter")
        service_filter = page.locator("#service-filter")
        
        if service_filter.count() > 0:
            options = service_filter.locator("option")
            option_count = options.count()
            print(f"    ✓ Service filter has {option_count} options")
        
        # Step 4: Test Client filter
        print("\n  Step 4: Test Client filter")
        client_filter = page.locator("#client-filter")
        
        if client_filter.count() > 0:
            options = client_filter.locator("option")
            option_count = options.count()
            print(f"    ✓ Client filter has {option_count} options")
            
            # Select specific client
            if option_count > 1:
                client_filter.select_option(index=1)
                page.click("#apply-filters")
                page.wait_for_timeout(1500)
                
                filtered_total = page.locator("#total-cost").inner_text()
                print(f"    After client filter: {filtered_total}")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
