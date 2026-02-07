"""
File: test_tc_e2e_006.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-E2E-006
Description: Cost summary cards display data (FR-01)
"""

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:8080"

@pytest.mark.e2e
class TestE2E006:
    """TC-E2E-006: Cost summary cards display correctly"""
    
    TEST_ID = "TC-E2E-006"
    PURPOSE = "Verify cost summary cards show Total, AWS, Azure, Savings"
    REQUIREMENT = "FR-01: View Cost Dashboard"
    
    def test_cost_cards(self, page: Page):
        """Verify cost cards display values"""
        
        print(f"\n{'='*70}")
        print(f"TEST CASE ID:      {self.TEST_ID}")
        print(f"PURPOSE:           {self.PURPOSE}")
        print(f"{'='*70}")
        
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        
        # Wait for data to load
        page.wait_for_timeout(2000)
        
        # Check Total Cost card
        print("\n  Step 1: Verify Total Cost card")
        total_cost = page.locator("#total-cost")
        expect(total_cost).to_be_visible()
        total_value = total_cost.inner_text()
        print(f"    ✓ Total Cost: {total_value}")
        
        # Check AWS Cost card
        print("\n  Step 2: Verify AWS Cost card")
        aws_cost = page.locator("#aws-cost")
        expect(aws_cost).to_be_visible()
        aws_value = aws_cost.inner_text()
        print(f"    ✓ AWS Cost: {aws_value}")
        
        # Check Azure Cost card
        print("\n  Step 3: Verify Azure Cost card")
        azure_cost = page.locator("#azure-cost")
        expect(azure_cost).to_be_visible()
        azure_value = azure_cost.inner_text()
        print(f"    ✓ Azure Cost: {azure_value}")
        
        # Check Potential Savings card
        print("\n  Step 4: Verify Potential Savings card")
        savings = page.locator("#potential-savings")
        expect(savings).to_be_visible()
        savings_value = savings.inner_text()
        print(f"    ✓ Potential Savings: {savings_value}")
        
        print(f"\n{'='*70}")
        print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
        print(f"{'='*70}")
