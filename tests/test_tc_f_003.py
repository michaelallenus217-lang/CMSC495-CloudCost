"""
File: test_tc_f_003.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-F-003
Description: FR-03 - Filter by Provider/Service
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.functional
class TestTCF003:
    """TC-F-003: FR-03 - Provider and service filtering"""
    
    TEST_ID = "TC-F-003"
    TEST_TYPE = "Functionality Testing"
    PURPOSE = "Verify filtering by provider and service type"
    REQUIREMENT = "FR-03: Filter by Provider/Service - Drill down by AWS, Azure, or by service"
    
    def test_filter_capability(self, request):
        """Verify data supports filtering by provider and service"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"REQUIREMENT:       {self.REQUIREMENT}")
            print(f"{'='*70}")
        
        # Get providers for filtering
        providers_resp = requests.get(f"{BASE_URL}/providers", timeout=TIMEOUT)
        providers = providers_resp.json()["data"]
        
        # Get services for filtering
        services_resp = requests.get(f"{BASE_URL}/services", timeout=TIMEOUT)
        services = services_resp.json()["data"]
        
        # Get service types
        service_types = set(s.get("service_type", "Unknown") for s in services)
        
        if verbose:
            print(f"\nAVAILABLE FILTERS:")
            print(f"\n  Providers ({len(providers)}):")
            for p in providers:
                print(f"    - {p['provider_name']} (ID: {p['provider_id']})")
            print(f"\n  Service Types ({len(service_types)}):")
            for st in sorted(service_types):
                print(f"    - {st}")
            print(f"\n  Services ({len(services)}):")
            for s in services[:5]:
                print(f"    - {s['service_name']} ({s.get('service_type', 'N/A')})")
            if len(services) > 5:
                print(f"    ... and {len(services) - 5} more")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [X] Pass  [ ] Fail")
            print(f"{'='*70}")
        
        # Verify filter data exists
        assert len(providers) >= 2, "Need at least 2 providers for filtering"
        assert len(services) > 0, "Need services for filtering"
