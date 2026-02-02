import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_health_returns_ok():
    response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    assert response.json().get("status") == "ok"
