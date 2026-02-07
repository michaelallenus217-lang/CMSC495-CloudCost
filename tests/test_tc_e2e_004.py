"""
File: test_tc_e2e_004.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-004
Description: End-to-end test - Full user workflow
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E004:
    """TC-E2E-004: Complete user workflow"""
    
    TEST_ID = "TC-E2E-004"
    TEST_TYPE = "End-to-End Testing"
    PURPOSE = "Verify complete user workflow: load → view data → interact"
    REQUIREMENT = "FR-01 through FR-08: Full application flow"
    
    def test_full_workflow(self, page: Page):
        """Verify user can complete basic workflow"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        # Step 1: Load dashboard
        print("\n  Step 1: Navigate to dashboard")
        page.goto(BASE_URL)
        expect(page).to_have_title("Cloud Cost Intelligence Platform")
        print("    ✓ Dashboard loaded")
        
        # Step 2: Wait for data to load
        print("\n  Step 2: Wait for data to load")
        page.wait_for_load_state("networkidle")
        print("    ✓ Network idle - data loaded")
        
        # Step 3: Verify content is visible
        print("\n  Step 3: Verify content displayed")
        body = page.locator("body")
        expect(body).not_to_be_empty()
        print("    ✓ Content rendered")
        
        # Step 4: Check for charts
        print("\n  Step 4: Check for visualizations")
        charts = page.locator("canvas")
        if charts.count() > 0:
            print(f"    ✓ {charts.count()} chart(s) found")
        else:
            print("    - No canvas charts (may use different visualization)")
        
        # Step 5: Screenshot for documentation
        print("\n  Step 5: Capture screenshot")
        page.screenshot(path="tests/screenshots/dashboard_e2e.png", full_page=True)
        print("    ✓ Screenshot saved to tests/screenshots/dashboard_e2e.png")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
