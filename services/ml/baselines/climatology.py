import numpy as np
import joblib
from .interfaces import IModel

class ClimatologyBaseline(IModel):
    """
    Outputs the historical mean of the observed data, ignoring the NWP forecast.
    Acts as a benchmark for determining if NWP adds any value over historical averages.
    """
    def __init__(self):
        self.climatology_mean = 0.0
        
    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Calculates the mean of the observed target `y`.
        In a full spatial implementation, this would be a per-grid cell mean.
        For baseline evaluation, we use a global mean or expect `y` to be for a specific cell.
        """
        self.climatology_mean = float(np.mean(y))
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        # Output the mean regardless of the input X
        batch_size = X.shape[0] if len(X.shape) > 0 else 1
        return np.full(batch_size, self.climatology_mean)
        
    def save(self, filepath: str) -> None:
        joblib.dump({'climatology_mean': self.climatology_mean}, filepath)
        
    def load(self, filepath: str) -> None:
        data = joblib.load(filepath)
        self.climatology_mean = data['climatology_mean']
