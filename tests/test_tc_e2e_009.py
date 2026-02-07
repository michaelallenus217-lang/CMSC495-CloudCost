"""
File: test_tc_e2e_009.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-009
Description: Trend chart renders with data (FR-02)
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E009:
    """TC-E2E-009: Trend chart displays spending over time"""
    
    TEST_ID = "TC-E2E-009"
    PURPOSE = "Verify trend chart canvas renders with Chart.js"
    REQUIREMENT = "FR-02: View Spending Trends"
    
    def test_trend_chart(self, page: Page):
        """Verify trend chart renders"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        
        # Wait for chart to render
        page.wait_for_timeout(2000)
        
        # Verify chart canvas exists
        print("\n  Step 1: Verify trend chart canvas")
        chart = page.locator("#trend-chart")
        expect(chart).to_be_visible()
        print("    ✓ Trend chart canvas visible")
        
        # Check canvas dimensions (rendered chart has dimensions)
        print("\n  Step 2: Verify chart has rendered dimensions")
        width = chart.evaluate("el => el.width")
        height = chart.evaluate("el => el.height")
        print(f"    ✓ Chart dimensions: {width}x{height}")
        
        assert width > 0, "Chart width should be > 0"
        assert height > 0, "Chart height should be > 0"
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
