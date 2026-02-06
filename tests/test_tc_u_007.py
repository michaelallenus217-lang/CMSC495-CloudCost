"""
File: test_tc_u_007.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-U-007
Description: Verify service data includes provider relationship
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.unit
class TestTCU007:
    """TC-U-007: Verify service-provider relationship in data"""
    
    TEST_ID = "TC-U-007"
    TEST_TYPE = "Unit Testing"
    PURPOSE = "Verify services include provider_id foreign key (Service→Provider)"
    REQUIREMENT = "Database Schema: Services.ProviderID (FK)"
    
    def test_service_provider_link(self, request):
        """Verify service records contain provider_id"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        response = requests.get(f"{BASE_URL}/services", timeout=TIMEOUT)
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        assert len(services) > 0, "No services found"
        
        # Check all services have provider_id
        services_with_provider = [s for s in services if "provider_id" in s]
        
        if verbose:
            print(f"\nTotal services:      {len(services)}")
            print(f"With provider_id:    {len(services_with_provider)}")
            print(f"Missing provider_id: {len(services) - len(services_with_provider)}")
        
        assert len(services_with_provider) == len(services), "Some services missing provider_id"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
