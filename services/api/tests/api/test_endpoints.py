from fastapi.testclient import TestClient

def test_forecast_endpoint(client: TestClient):
    response = client.get("/api/v1/forecast?lead_time=T+24h&display_mode=bias_corrected")
    assert response.status_code == 200
    data = response.json()
    assert data["leadTime"] == "T+24h"
    assert data["displayMode"] == "bias_corrected"
    assert data["totalGrids"] > 50
    assert "averageRainfallMm" in data
    assert len(data["grids"]) > 0

    first_grid = data["grids"][0]
    assert "id" in first_grid
    assert "lat" in first_grid
    assert "lon" in first_grid
    assert "correctedRainfallMm" in first_grid
    assert "p10Mm" in first_grid
    assert "p90Mm" in first_grid
    assert "regime" in first_grid

def test_forecast_lead_time_modulation(client: TestClient):
    r24 = client.get("/api/v1/forecast?lead_time=T+24h&display_mode=bias_corrected").json()
    r72 = client.get("/api/v1/forecast?lead_time=T+72h&display_mode=bias_corrected").json()
    assert r72["averageRainfallMm"] > r24["averageRainfallMm"]

def test_forecast_map(client: TestClient):
    response = client.get("/api/v1/forecast/map?lead_time=T+24h")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0
    assert data["features"][0]["geometry"]["type"] == "Polygon"

def test_grid_timeseries(client: TestClient):
    response = client.get("/api/v1/forecast/grids/G10025/timeseries")
    assert response.status_code == 200
    data = response.json()
    assert data["gridId"] == "G10025"
    assert len(data["series"]) == 8
    assert data["series"][0]["time"] == "00:00"

def test_error_mechanisms(client: TestClient):
    response = client.get("/api/v1/forecast/error-mechanisms")
    assert response.status_code == 200
    data = response.json()
    assert len(data["mechanismsSummary"]) == 8
    assert len(data["regionalProfiles"]) > 0

def test_regime_distribution(client: TestClient):
    response = client.get("/api/v1/regime/distribution")
    assert response.status_code == 200
    data = response.json()
    assert len(data["distribution"]) == 7
    total_pct = sum(d["percentage"] for d in data["distribution"])
    assert round(total_pct) == 100
    assert len(data["matrix"]) == 7

def test_transition_monitor(client: TestClient):
    response = client.get("/api/v1/transition/monitor")
    assert response.status_code == 200
    data = response.json()
    assert data["totalTransitioningGrids"] >= 0
    assert len(data["dominantTransitions"]) > 0

def test_uncertainty_quantiles(client: TestClient):
    response = client.get("/api/v1/uncertainty/quantiles")
    assert response.status_code == 200
    data = response.json()
    assert data["meanP10"] <= data["meanP50"] <= data["meanP90"]
    assert len(data["zones"]) == 5
    assert len(data["spreadHistogram"]) == 5

def test_verification_metrics(client: TestClient):
    response = client.get("/api/v1/verification/metrics")
    assert response.status_code == 200
    data = response.json()
    arjuna = next(m for m in data["models"] if "ARJUNA" in m["modelName"])
    nwp = next(m for m in data["models"] if "Raw NWP" in m["modelName"])
    assert arjuna["csi"] > nwp["csi"]
    assert arjuna["rmse"] < nwp["rmse"]

def test_district_forecast(client: TestClient):
    response = client.get("/api/v1/district/forecast")
    assert response.status_code == 200
    data = response.json()
    assert data["totalDistricts"] > 0
    assert len(data["districts"]) > 0
    first_district = data["districts"][0]
    assert first_district["alertLevel"] in ["Red", "Orange", "Yellow", "Green"]

def test_alerts_feed(client: TestClient):
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert data["activeCount"] > 0
    assert len(data["alerts"]) > 0

def test_climatology(client: TestClient):
    response = client.get("/api/v1/climatology/monsoon")
    assert response.status_code == 200
    data = response.json()
    assert len(data["monthly"]) == 4
    assert len(data["subdivisions"]) > 0

def test_system_and_settings(client: TestClient):
    health = client.get("/api/v1/system/data-health")
    assert health.status_code == 200
    assert health.json()["activeSources"] == 6

    models = client.get("/api/v1/system/models")
    assert models.status_code == 200
    assert len(models.json()["models"]) == 4

    settings_get = client.get("/api/v1/system/settings")
    assert settings_get.status_code == 200
    assert settings_get.json()["thresholds"]["heavyThreshold"] == 64.5

    settings_post = client.post("/api/v1/system/settings", json={
        "thresholds": {"heavyThreshold": 65.0}
    })
    assert settings_post.status_code == 200
    assert settings_post.json()["thresholds"]["heavyThreshold"] == 65.0
