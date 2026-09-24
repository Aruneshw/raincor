import pytest
import numpy as np
import os
from baselines.raw_nwp import RawNWPBaseline
from baselines.climatology import ClimatologyBaseline
from baselines.simple_bias import SimpleBiasCorrection
from correction.qm.qm import EmpiricalQuantileMapping
from evaluation.metrics import MetricsEngine

@pytest.fixture
def synthetic_data():
    X = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    y = np.array([0.5, 1.5, 2.5, 3.5, 4.5])
    return X, y

def test_raw_nwp(synthetic_data):
    X, y = synthetic_data
    model = RawNWPBaseline()
    model.train(X, y)
    preds = model.predict(X)
    assert np.allclose(preds, X)

def test_climatology(synthetic_data):
    X, y = synthetic_data
    model = ClimatologyBaseline()
    model.train(X, y)
    preds = model.predict(X)
    assert np.allclose(preds, np.full(5, 2.5))

def test_simple_bias(synthetic_data):
    X, y = synthetic_data
    # NWP overestimates by exactly 0.5 everywhere
    model = SimpleBiasCorrection()
    model.train(X, y)
    assert np.isclose(model.mean_bias, 0.5)
    
    preds = model.predict(X)
    assert np.allclose(preds, y)

def test_quantile_mapping(synthetic_data, tmp_path):
    X, y = synthetic_data
    model = EmpiricalQuantileMapping(n_quantiles=5)
    model.train(X, y)
    
    preds = model.predict(X)
    # The quantiles match exactly, so it should perfectly map back to y
    assert np.allclose(preds, y)
    
    # Test persistence
    save_path = os.path.join(tmp_path, "qm.joblib")
    model.save(save_path)
    
    new_model = EmpiricalQuantileMapping()
    new_model.load(save_path)
    
    new_preds = new_model.predict(X)
    assert np.allclose(new_preds, preds)

def test_metrics_engine():
    # True: [0.0, 2.0, 5.0, 10.0]
    # Pred: [0.0, 3.0, 4.0,  0.0]
    # Threshold = 2.5
    # Events True: [False, False, True, True] -> 2 true events
    # Events Pred: [False, True,  True, False] -> 2 pred events
    # Hits: (5.0 & 4.0) = 1
    # Misses: (10.0 & 0.0) = 1
    # False Alarm: (2.0 & 3.0) = 1
    
    y_true = np.array([0.0, 2.0, 5.0, 10.0])
    y_pred = np.array([0.0, 3.0, 4.0, 0.0])
    
    engine = MetricsEngine(threshold=2.5)
    metrics = engine.evaluate(y_true, y_pred)
    
    assert np.isclose(metrics["POD"], 0.5) # 1 hit / (1 hit + 1 miss)
    assert np.isclose(metrics["FAR"], 0.5) # 1 fa / (1 hit + 1 fa)
    assert np.isclose(metrics["CSI"], 1.0 / 3.0) # 1 hit / (1 hit + 1 miss + 1 fa)
