import requests
from conftest import BASE_URL, assert_json_response, TIMEOUT

def test_invoices_returns_list():
    response = requests.get(f"{BASE_URL}/invoices", timeout=TIMEOUT)
    assert response.status_code == 200
    assert_json_response(response)
    data = response.json()
    assert data.get("status") == "ok"
    assert isinstance(data.get("invoices"), list)
