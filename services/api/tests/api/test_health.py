from fastapi.testclient import TestClient
from app.core.config import settings

def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "environment": settings.APP_ENV}

def test_version(client: TestClient):
    response = client.get(f"{settings.API_V1_STR}/version")
    assert response.status_code == 200
    assert "version" in response.json()
    assert response.json()["project"] == settings.PROJECT_NAME
