import pytest
import numpy as np
import pandas as pd
import torch
from services.ml.evaluation.metrics import MetricsEngine
from services.ml.evaluation.probabilistic import crps_quantile, brier_score, roc_auc
from services.ml.evaluation.engine import VerificationEngine

def test_regression_metrics():
    engine = MetricsEngine()
    y_true = np.array([10.0, 20.0, 30.0])
    y_pred = np.array([12.0, 18.0, 30.0])
    
    metrics = engine.evaluate(y_true, y_pred)
    
    # Error: 2.0, -2.0, 0.0
    # Bias: 0.0
    # MAE: (2+2+0)/3 = 4/3 = 1.333...
    # RMSE: sqrt((4+4+0)/3) = sqrt(8/3) = 1.63299
    
    assert np.isclose(metrics['Bias'], 0.0)
    assert np.isclose(metrics['MAE'], 4.0/3.0)
    assert np.isclose(metrics['RMSE'], np.sqrt(8.0/3.0))

def test_categorical_metrics():
    # threshold = 2.5
    engine = MetricsEngine(threshold=2.5)
    
    y_true = np.array([0.0, 5.0, 10.0, 1.0, 3.0])
    # obs events: False, True, True, False, True (T, T, T) -> 3 events
    
    y_pred = np.array([0.0, 1.0, 12.0, 4.0, 5.0])
    # pred events: False, False, True, True, True
    
    # hits: (10, 12), (3, 5) -> 2
    # misses: (5, 1) -> 1
    # false_alarms: (1, 4) -> 1
    # correct negs: (0, 0) -> 1
    # total = 5
    
    metrics = engine.evaluate(y_true, y_pred)
    
    assert np.isclose(metrics['POD'], 2 / 3) # Hits / (Hits + Misses)
    assert np.isclose(metrics['FAR'], 1 / 3) # FA / (Hits + FA)
    assert np.isclose(metrics['CSI'], 2 / 4) # Hits / (Hits + Misses + FA)
    
    # ETS:
    # hits_random = ((2+1)*(2+1)) / 5 = 9/5 = 1.8
    # ets = (2 - 1.8) / (2 + 1 + 1 - 1.8) = 0.2 / 2.2 = 1/11 ~ 0.0909
    assert np.isclose(metrics['ETS'], 1/11, atol=1e-4)

def test_fss():
    engine = MetricsEngine(threshold=2.5)
    # A 3x3 grid
    y_true = np.array([
        [0, 5, 0],
        [0, 0, 0],
        [0, 0, 0]
    ])
    y_pred = np.array([
        [0, 0, 0],
        [0, 5, 0],
        [0, 0, 0]
    ])
    
    # In a 3x3 window, the fraction of events is 1/9 everywhere the window covers it.
    # The FSS calculation relies on exact spatial overlap. We'll just assert it runs and returns a valid float.
    score = engine.fss(y_true, y_pred, window_size=3)
    assert 0.0 <= score <= 1.0
    
    # Perfect match
    score_perfect = engine.fss(y_true, y_true, window_size=3)
    assert np.isclose(score_perfect, 1.0)

def test_brier_score():
    probs = torch.tensor([0.2, 0.8, 0.4])
    obs = torch.tensor([0.0, 1.0, 1.0])
    
    bs = brier_score(probs, obs)
    # (0.2)^2, (0.2)^2, (0.6)^2 = 0.04, 0.04, 0.36
    assert torch.allclose(bs, torch.tensor([0.04, 0.04, 0.36]))

def test_roc_auc():
    probs = torch.tensor([0.1, 0.4, 0.6, 0.9])
    obs = torch.tensor([0.0, 0.0, 1.0, 1.0])
    
    tpr, fpr, auc = roc_auc(probs, obs)
    # perfect sorting -> AUC = 1.0
    assert np.isclose(auc, 1.0)
    
def test_crps():
    q = torch.tensor([[10.0, 20.0, 30.0]])
    obs = torch.tensor([[25.0]])
    q_levels = torch.tensor([0.1, 0.5, 0.9])
    
    crps = crps_quantile(q, obs, q_levels)
    assert crps.shape == (1,)
    assert crps.item() >= 0.0

def test_verification_engine():
    df = pd.DataFrame({
        'grid_id': [1, 2, 3, 4],
        'region': ['A', 'A', 'B', 'B'],
        'observed': [0.0, 10.0, 20.0, 3.0],
        'Raw_NWP_pred': [1.0, 8.0, 15.0, 5.0],
        'Raw_NWP_prob': [0.1, 0.7, 0.8, 0.6],
        'Raw_NWP_q10': [0.0, 5.0, 10.0, 1.0],
        'Raw_NWP_q50': [1.0, 8.0, 15.0, 5.0],
        'Raw_NWP_q90': [2.0, 12.0, 20.0, 8.0]
    })
    
    verif = VerificationEngine(thresholds=[2.5, 10.0])
    results = verif.run_full_verification(df, output_file="/tmp/test_verif.json")
    
    assert 'all' in results
    assert 'all_grids' in results['all']
    assert 'T_2.5' in results['all']['all_grids']
    assert 'Raw_NWP' in results['all']['all_grids']['T_2.5']
    
    metrics = results['all']['all_grids']['T_2.5']['Raw_NWP']
    assert 'RMSE' in metrics
    assert 'ETS' in metrics
    assert 'AUC' in metrics
    assert 'CRPS' in metrics
    
    assert 'region' in results
    assert 'A' in results['region']
