import pytest
import requests
import time
import os

BASE_URL = os.getenv("TEST_API_URL", "http://localhost:5000/api/v1")
TIMEOUT = 30

@pytest.fixture(scope="session")
def api_base():
    return BASE_URL

@pytest.fixture(scope="session", autouse=True)
def warmup_db():
    """Wake up Azure SQL before tests run."""
    for attempt in range(3):
        try:
            requests.get(f"{BASE_URL}/health", timeout=30)
            return
        except:
            time.sleep(10)

def assert_json_response(response: requests.Response):
    content_type = response.headers.get("Content-Type", "")
    assert "application/json" in content_type.lower()
