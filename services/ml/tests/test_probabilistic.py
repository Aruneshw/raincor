import torch
import pytest
from services.ml.probabilistic.quantiles import QuantileRegression, EnsembleProbabilisticExtractor
from services.ml.probabilistic.calibration import PlattCalibration
from services.ml.evaluation.probabilistic import crps_quantile, brier_score, reliability_curve

def test_quantile_regression():
    quantiles = [0.1, 0.5, 0.9]
    model = QuantileRegression(input_dim=10, quantiles=quantiles)
    
    x = torch.randn(4, 100, 10)
    out = model(x)
    
    assert out.shape == (4, 100, 3)
    # Check monotonicity
    assert torch.all(out[:, :, 0] <= out[:, :, 1])
    assert torch.all(out[:, :, 1] <= out[:, :, 2])
    # Check non-negative
    assert torch.all(out >= 0.0)

def test_ensemble_extractor():
    quantiles = [0.1, 0.5, 0.9]
    extractor = EnsembleProbabilisticExtractor(quantiles=quantiles)
    
    # 4 batches, 10 grids, 50 members
    ensemble = torch.rand(4, 10, 50) * 200.0
    
    q = extractor.extract_quantiles(ensemble)
    assert q.shape == (4, 10, 3)
    assert torch.all(q[..., 0] <= q[..., 1])
    assert torch.all(q[..., 1] <= q[..., 2])
    
    spread = extractor.extract_spread(ensemble)
    assert spread.shape == (4, 10)
    assert torch.all(spread >= 0.0)
    
    thresholds = {'heavy': 64.5, 'very_heavy': 115.5, 'extreme': 204.5}
    probs = extractor.extract_threshold_probabilities(ensemble, thresholds)
    assert 'heavy' in probs
    assert probs['heavy'].shape == (4, 10)
    assert torch.all(probs['heavy'] >= 0.0) and torch.all(probs['heavy'] <= 1.0)
    assert torch.all(probs['extreme'] <= probs['heavy']) # extreme threshold is higher

def test_platt_calibration():
    calib = PlattCalibration()
    
    raw_probs = torch.tensor([0.1, 0.5, 0.9, 0.0, 1.0])
    calib.a.data = torch.tensor(2.0) # steeper
    calib.b.data = torch.tensor(0.5) # shift
    
    calibrated = calib(raw_probs)
    assert calibrated.shape == raw_probs.shape
    assert torch.all(calibrated >= 0.0) and torch.all(calibrated <= 1.0)
    
def test_evaluation_metrics():
    # CRPS
    forecast_quantiles = torch.tensor([[10.0, 20.0, 30.0], [5.0, 10.0, 15.0]])
    observed = torch.tensor([[25.0], [5.0]])
    quantiles = torch.tensor([0.1, 0.5, 0.9])
    
    crps_val = crps_quantile(forecast_quantiles, observed, quantiles)
    assert crps_val.shape == (2,)
    assert torch.all(crps_val >= 0.0)
    
    # Brier Score
    forecast_probs = torch.tensor([0.1, 0.9, 0.4, 0.6])
    observed_binary = torch.tensor([0.0, 1.0, 0.0, 1.0])
    bs = brier_score(forecast_probs, observed_binary)
    assert bs.shape == (4,)
    assert torch.allclose(bs, torch.tensor([0.01, 0.01, 0.16, 0.16]))
    
    # Reliability
    centers, emp_probs, counts = reliability_curve(forecast_probs, observed_binary, num_bins=5)
    assert centers.shape == (5,)
    assert emp_probs.shape == (5,)
    assert counts.shape == (5,)
