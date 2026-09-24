import numpy as np
from typing import Dict, Union

class MetricsEngine:
    """
    Evaluates regression and categorical forecast metrics.
    """
    def __init__(self, threshold: float = 2.5):
        """
        threshold: The value (e.g., in mm) above which an event is considered a 'hit'.
        """
        self.threshold = threshold

    def evaluate(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculates all baseline evaluation metrics."""
        y_true = np.asarray(y_true)
        y_pred = np.asarray(y_pred)
        
        # Regression Metrics
        error = y_pred - y_true
        bias = float(np.mean(error))
        mae = float(np.mean(np.abs(error)))
        rmse = float(np.sqrt(np.mean(error**2)))
        
        # Categorical Metrics
        obs_event = y_true >= self.threshold
        pred_event = y_pred >= self.threshold
        
        hits = np.sum(obs_event & pred_event)
        misses = np.sum(obs_event & ~pred_event)
        false_alarms = np.sum(~obs_event & pred_event)
        correct_negatives = np.sum(~obs_event & ~pred_event)
        total = hits + misses + false_alarms + correct_negatives
        
        eps = 1e-7
        
        pod = float(hits / (hits + misses + eps))
        far = float(false_alarms / (hits + false_alarms + eps))
        csi = float(hits / (hits + misses + false_alarms + eps))
        
        # Equitable Threat Score (ETS)
        hits_random = ((hits + misses) * (hits + false_alarms)) / (total + eps)
        ets = float((hits - hits_random) / (hits + misses + false_alarms - hits_random + eps))
        
        return {
            "RMSE": rmse,
            "MAE": mae,
            "Bias": bias,
            "POD": pod,
            "FAR": far,
            "CSI": csi,
            "ETS": ets
        }
        
    def fss(self, y_true_2d: np.ndarray, y_pred_2d: np.ndarray, window_size: int = 3) -> float:
        """
        Computes Fractions Skill Score (FSS) for 2D spatial fields.
        """
        from scipy.ndimage import uniform_filter
        
        obs_binary = (y_true_2d >= self.threshold).astype(float)
        pred_binary = (y_pred_2d >= self.threshold).astype(float)
        
        obs_frac = uniform_filter(obs_binary, size=window_size, mode='constant')
        pred_frac = uniform_filter(pred_binary, size=window_size, mode='constant')
        
        mse_frac = np.nanmean((obs_frac - pred_frac)**2)
        mse_ref = np.nanmean(obs_frac**2 + pred_frac**2)
        
        if mse_ref == 0:
            return 1.0 # Perfect score if neither has events
            
        return float(1.0 - (mse_frac / mse_ref))
