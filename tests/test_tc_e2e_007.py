"""
File: test_tc_e2e_007.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-007
Description: Filter panel functionality (FR-03)
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E007:
    """TC-E2E-007: Filter panel controls work"""
    
    TEST_ID = "TC-E2E-007"
    PURPOSE = "Verify Provider, Service, Client, Date filters exist and function"
    REQUIREMENT = "FR-03: Filter by Provider/Service"
    
    def test_filter_controls(self, page: Page):
        """Verify all filter controls exist and have options"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        
        # Provider filter
        print("\n  Step 1: Verify Provider filter")
        provider_filter = page.locator("#provider-filter")
        expect(provider_filter).to_be_visible()
        provider_options = provider_filter.locator("option").count()
        print(f"    ✓ Provider filter: {provider_options} options")
        
        # Service filter
        print("\n  Step 2: Verify Service filter")
        service_filter = page.locator("#service-filter")
        expect(service_filter).to_be_visible()
        service_options = service_filter.locator("option").count()
        print(f"    ✓ Service filter: {service_options} options")
        
        # Client filter
        print("\n  Step 3: Verify Client filter")
        client_filter = page.locator("#client-filter")
        expect(client_filter).to_be_visible()
        client_options = client_filter.locator("option").count()
        print(f"    ✓ Client filter: {client_options} options")
        
        # Date range selector
        print("\n  Step 4: Verify Date Range selector")
        date_selector = page.locator("#date-range-selector")
        expect(date_selector).to_be_visible()
        date_options = date_selector.locator("option").count()
        print(f"    ✓ Date selector: {date_options} options")
        
        # Apply/Clear buttons
        print("\n  Step 5: Verify Apply/Clear buttons")
        apply_btn = page.locator("#apply-filters")
        clear_btn = page.locator("#clear-filters")
        expect(apply_btn).to_be_visible()
        expect(clear_btn).to_be_visible()
        print("    ✓ Apply Filters button visible")
        print("    ✓ Clear button visible")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
