"""
File: test_tc_e2e_005.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-005
Description: Navigation bar functionality
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E005:
    """TC-E2E-005: Navigation bar works correctly"""
    
    TEST_ID = "TC-E2E-005"
    PURPOSE = "Verify navigation links switch between views"
    REQUIREMENT = "GUI Component: NavigationBar"
    
    def test_navigation(self, page: Page):
        """Verify all navigation links work"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        
        # Test Dashboard link
        print("\n  Step 1: Click Dashboard link")
        page.click('a[data-page="dashboard"]')
        expect(page.locator("#dashboard-view")).to_be_visible()
        print("    ✓ Dashboard view visible")
        
        # Test Waste Alerts link
        print("\n  Step 2: Click Waste Alerts link")
        page.click('a[data-page="waste"]')
        expect(page.locator("#waste-alerts-view")).to_be_visible()
        print("    ✓ Waste Alerts view visible")
        
        # Test Recommendations link
        print("\n  Step 3: Click Recommendations link")
        page.click('a[data-page="recommendations"]')
        expect(page.locator("#recommendations-view")).to_be_visible()
        print("    ✓ Recommendations view visible")
        
        # Test Settings link
        print("\n  Step 4: Click Settings link")
        page.click('a[data-page="settings"]')
        expect(page.locator("#settings-view")).to_be_visible()
        print("    ✓ Settings view visible")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
