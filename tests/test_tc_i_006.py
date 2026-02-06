"""
File: test_tc_i_006.py
Project: Cloud Cost Intelligence Platform
Test ID: TC-I-006
Description: Verify service records link to valid providers
"""

import pytest
import requests
from conftest import BASE_URL, TIMEOUT

@pytest.mark.integration
class TestTCI006:
    """TC-I-006: Verify service-provider relationship integrity"""
    
    TEST_ID = "TC-I-006"
    TEST_TYPE = "Integration Testing"
    PURPOSE = "Verify all services reference valid provider_ids (FK integrity)"
    REQUIREMENT = "Database Schema: Services.ProviderID (FK) → Providers.ProviderID"
    
    def test_service_provider_integrity(self, request):
        """Verify all service provider_ids exist in providers table"""
        verbose = request.config.getoption("capture") == "no"
        
        if verbose:
            print(f"\n{'='*70}")
            print(f"TEST CASE ID:      {self.TEST_ID}")
            print(f"PURPOSE:           {self.PURPOSE}")
            print(f"{'='*70}")
        
        # Get all providers
        providers_resp = requests.get(f"{BASE_URL}/providers", timeout=TIMEOUT)
        assert providers_resp.status_code == 200
        provider_ids = {p["provider_id"] for p in providers_resp.json().get("providers", [])}
        
        # Get all services
        services_resp = requests.get(f"{BASE_URL}/services", timeout=TIMEOUT)
        assert services_resp.status_code == 200
        services = services_resp.json().get("services", [])
        
        # Check each service references valid provider
        orphan_services = [s for s in services if s["provider_id"] not in provider_ids]
        
        if verbose:
            print(f"\nTotal providers:     {len(provider_ids)}")
            print(f"Provider IDs:        {provider_ids}")
            print(f"Total services:      {len(services)}")
            print(f"Orphan services:     {len(orphan_services)}")
            print(f"\n{'='*70}")
            print(f"PASS/FAIL:         [{'X' if not orphan_services else ' '}] Pass  [{' ' if not orphan_services else 'X'}] Fail")
            print(f"{'='*70}")
        
        assert not orphan_services, f"Found {len(orphan_services)} services with invalid provider_id"
