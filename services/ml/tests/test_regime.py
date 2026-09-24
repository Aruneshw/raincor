import pytest
import numpy as np
from regime.discovery.cluster import RegimeDiscoverer
from regime.classifier.lgb_head import LGBRegimeHead
from regime.classifier.hierarchical_model import HierarchicalRegimeClassifier
from regime.calibration.temperature_scaling import calibrate_probabilities, TemperatureScaler

def test_discovery():
    X = np.random.randn(100, 5)
    
    # GMM
    discoverer = RegimeDiscoverer(method='gmm', n_clusters=3)
    labels = discoverer.fit(X)
    assert len(np.unique(labels)) <= 3
    
    preds = discoverer.predict(X[:10])
    assert len(preds) == 10

def test_probability_sums():
    """Verify that LightGBM multiclass outputs sum to 1."""
    X = np.random.randn(50, 4)
    y = np.random.randint(0, 3, size=50) # 3 classes
    
    head = LGBRegimeHead(num_classes=3)
    head.train(X, y, num_boost_round=5)
    
    probs = head.predict_proba(X[:5])
    assert probs.shape == (5, 3)
    
    # Sum across classes should be 1.0
    sums = np.sum(probs, axis=1)
    assert np.allclose(sums, 1.0)

def test_calibration():
    """Verify temperature scaling sharpens/smooths properly."""
    logits = np.array([[2.0, 1.0, 0.1]])
    
    # T=1 is standard softmax
    p1 = calibrate_probabilities(logits, temperature=1.0)
    
    # T > 1 smooths
    p_smooth = calibrate_probabilities(logits, temperature=2.0)
    
    # T < 1 sharpens
    p_sharp = calibrate_probabilities(logits, temperature=0.5)
    
    # Check max probability (sharpened should be highest, smoothed lowest)
    assert np.max(p_sharp) > np.max(p1)
    assert np.max(p_smooth) < np.max(p1)
    
    # Check sums to 1
    assert np.allclose(np.sum(p_sharp), 1.0)

def test_class_imbalance():
    """Verify sample_weights can be ingested by LightGBM head."""
    X = np.random.randn(50, 4)
    y = np.random.randint(0, 3, size=50)
    
    # Weight rare classes 10x more
    weights = np.where(y == 2, 10.0, 1.0)
    
    head = LGBRegimeHead(num_classes=3)
    # Should train without error
    head.train(X, y, sample_weights=weights, num_boost_round=2)
    assert head.model is not None

def test_hierarchical_uncertainty():
    """Verify entropy and confidence calculations from the hierarchy."""
    # Generate random probabilities directly to test the Hierarchical wrapper
    class DummyHead:
        def __init__(self, probs):
            self.probs = probs
        def predict_proba(self, X):
            return self.probs
            
    # Mock the heads
    model = HierarchicalRegimeClassifier(2, 2, 2)
    
    # Case 1: High confidence (Low entropy)
    model.season_head = DummyHead(np.array([[0.9, 0.1]]))
    model.synoptic_head = DummyHead(np.array([[0.8, 0.2]]))
    model.local_head = DummyHead(np.array([[0.95, 0.05]]))
    
    res1 = model.predict(np.zeros((1, 1)))
    assert res1["confidence"][0] == (0.9 * 0.8 * 0.95)
    
    # Case 2: Low confidence (High entropy) -> Flat distributions
    model.season_head = DummyHead(np.array([[0.5, 0.5]]))
    model.synoptic_head = DummyHead(np.array([[0.5, 0.5]]))
    model.local_head = DummyHead(np.array([[0.5, 0.5]]))
    
    res2 = model.predict(np.zeros((1, 1)))
    assert res2["confidence"][0] == (0.5 * 0.5 * 0.5)
    
    # Entropy should be higher for the flat distribution
    assert res2["entropy"][0] > res1["entropy"][0]
