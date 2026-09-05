import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_editor_blocked_from_publishing():
    response = client.post("/admin/catalog/publish", headers={"X-Role": "editor"})
    assert response.status_code == 403
    assert "Permission denied" in response.json()["detail"]

def test_admin_allowed_publish_route_check():
    # Admin is allowed past role check (will fail on validation if data dirty, but not 403!)
    response = client.post("/admin/catalog/publish", headers={"X-Role": "admin"})
    assert response.status_code in [200, 400] # 400 if validation issues, but NOT 403!

def test_validation_report_accessible_by_editor():
    response = client.get("/admin/validation-report", headers={"X-Role": "editor"})
    assert response.status_code == 200
    assert "is_publishable" in response.json()
