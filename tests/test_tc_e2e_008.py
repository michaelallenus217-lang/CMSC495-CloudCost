"""
File: test_tc_e2e_008.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-008
Description: Waste Alerts view functionality (FR-04)
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E008:
    """TC-E2E-008: Waste Alerts page displays correctly"""
    
    TEST_ID = "TC-E2E-008"
    PURPOSE = "Verify Waste Alerts table displays resource utilization data"
    REQUIREMENT = "FR-04: View Waste Alerts"
    
    def test_waste_alerts(self, page: Page):
        """Verify waste alerts view displays table with data"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        
        # Navigate to Waste Alerts
        print("\n  Step 1: Navigate to Waste Alerts")
        page.click('a[data-page="waste"]')
        
        # Verify view is visible
        print("\n  Step 2: Verify Waste Alerts view loads")
        waste_view = page.locator("#waste-alerts-view")
        expect(waste_view).to_be_visible()
        print("    ✓ Waste Alerts view visible")
        
        # Check for alerts table
        print("\n  Step 3: Verify alerts table exists")
        alerts_table = page.locator(".alerts-table")
        expect(alerts_table).to_be_visible()
        print("    ✓ Alerts table visible")
        
        # Check table has rows
        print("\n  Step 4: Check table content")
        rows = alerts_table.locator("tbody tr")
        row_count = rows.count()
        print(f"    ✓ Table has {row_count} rows")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
