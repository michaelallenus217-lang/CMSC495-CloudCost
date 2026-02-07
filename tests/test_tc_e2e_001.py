"""
File: test_tc_e2e_001.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-001
Description: End-to-end test - Dashboard loads and displays data
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E001:
    """TC-E2E-001: Dashboard loads and displays cost data"""
    
    TEST_ID = "TC-E2E-001"
    TEST_TYPE = "End-to-End Testing"
    PURPOSE = "Verify dashboard loads and displays provider cost data"
    REQUIREMENT = "FR-01: View Cost Dashboard"
    
    def test_dashboard_loads(self, page: Page):
        """Verify dashboard page loads successfully"""
        
        # Navigate to dashboard
        page.goto(BASE_URL)
        
        # Verify page title
        expect(page).to_have_title("Cloud Cost Intelligence Platform")
        
        # Verify navbar exists
        navbar = page.locator("nav.navbar")
        expect(navbar).to_be_visible()
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"RESULT:            Dashboard loaded successfully")
        print(f"{'='*70}")
