"""
File: test_tc_e2e_002.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-002
Description: End-to-end test - Charts render with data
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E002:
    """TC-E2E-002: Charts render with cost data"""
    
    TEST_ID = "TC-E2E-002"
    TEST_TYPE = "End-to-End Testing"
    PURPOSE = "Verify Chart.js visualizations render with data"
    REQUIREMENT = "FR-02: View Spending Trends"
    
    def test_charts_render(self, page: Page):
        """Verify charts are visible on dashboard"""
        
        page.goto(BASE_URL)
        
        # Wait for page to load
        page.wait_for_load_state("networkidle")
        
        # Check for canvas elements (Chart.js renders to canvas)
        charts = page.locator("canvas")
        
        # Verify at least one chart exists
        expect(charts.first).to_be_visible(timeout=10000)
        
        chart_count = charts.count()
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"RESULT:            {chart_count} chart(s) rendered")
        print(f"{'='*70}")
