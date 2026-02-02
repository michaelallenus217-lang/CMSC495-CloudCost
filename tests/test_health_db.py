import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_health_db_connected():
    response = requests.get(f"{BASE_URL}/health/db", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    assert "status" in response.json()
