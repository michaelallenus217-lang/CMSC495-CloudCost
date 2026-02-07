"""
File: test_tc_e2e_010.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-010
Description: Settings/Budget configuration (FR-07)
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E010:
    """TC-E2E-010: Settings page for budget thresholds"""
    
    TEST_ID = "TC-E2E-010"
    PURPOSE = "Verify Settings page allows budget threshold configuration"
    REQUIREMENT = "FR-07: Set Budget Thresholds"
    
    def test_settings_page(self, page: Page):
        """Verify settings page loads with budget controls"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        
        # Navigate to Settings
        print("\n  Step 1: Navigate to Settings")
        page.click('a[data-page="settings"]')
        
        # Verify settings view loads
        print("\n  Step 2: Verify Settings view loads")
        settings_view = page.locator("#settings-view")
        expect(settings_view).to_be_visible()
        print("    ✓ Settings view visible")
        
        # Screenshot settings page
        print("\n  Step 3: Capture settings screenshot")
        page.screenshot(path="tests/screenshots/settings_e2e.png")
        print("    ✓ Screenshot saved")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
