import numpy as np
from app.ml import verification, geometry, moe, regime

def test_csi():
    # Example: 
    # y_hat = [1.0, 1.0, 0.0, 1.0] -> >0.5: T, T, F, T
    # y     = [1.0, 0.0, 1.0, 1.0] -> >0.5: T, F, T, T
    # Threshold = 0.5
    # TP = 2 (index 0 and 3)
    # FP = 1 (index 1)
    # FN = 1 (index 2)
    # TN = 0
    # CSI = TP / (TP + FP + FN) = 2 / 4 = 0.5
    y_hat = np.array([1.0, 1.0, 0.0, 1.0])
    y = np.array([1.0, 0.0, 1.0, 1.0])
    
    csi = verification.critical_success_index(y_hat, y, threshold=0.5)
    assert np.isclose(csi, 0.5)

def test_great_circle_distance():
    # New York (40.7128, -74.0060) to London (51.5074, -0.1278)
    # Expected distance is ~5570 km
    lat1, lon1 = np.array([40.7128]), np.array([-74.0060])
    lat2, lon2 = np.array([51.5074]), np.array([-0.1278])
    
    dist = geometry.great_circle_distance(lat1, lon1, lat2, lon2)
    assert 5500 < dist[0] < 5650

def test_softmax_temperature():
    z = np.array([[1.0, 2.0, 3.0]])
    p1 = moe.softmax(z, temperature=1.0)
    p2 = moe.softmax(z, temperature=10.0)
    
    # Higher temperature should make probabilities more uniform
    assert np.max(p2) < np.max(p1)
    assert np.isclose(np.sum(p1), 1.0)
    assert np.isclose(np.sum(p2), 1.0)

def test_regime_entropy():
    # Uniform probabilities = max entropy
    p_uniform = np.array([[0.25, 0.25, 0.25, 0.25]])
    # Certain probabilities = min entropy (0)
    p_certain = np.array([[1.0, 0.0, 0.0, 0.0]])
    
    h_uniform = regime.regime_entropy(p_uniform)
    h_certain = regime.regime_entropy(p_certain)
    
    assert h_uniform[0] > h_certain[0]
    assert np.isclose(h_certain[0], 0.0, atol=1e-5)
    
    c_uniform = regime.regime_confidence(p_uniform)
    c_certain = regime.regime_confidence(p_certain)
    
    assert np.isclose(c_uniform[0], 0.0, atol=1e-5)
    assert np.isclose(c_certain[0], 1.0, atol=1e-5)
