import numpy as np
import joblib
from .interfaces import IModel

class SimpleBiasCorrection(IModel):
    """
    Calculates the mean additive bias between NWP and observed data,
    and subtracts it during inference.
    """
    def __init__(self):
        self.mean_bias = 0.0
        
    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        X: NWP predictions (1D)
        y: Observed truth
        """
        # Ensure 1D
        if len(X.shape) > 1:
            X = X[:, 0]
            
        # Bias = Mean(NWP - Truth)
        # Therefore, Truth ~ NWP - Bias
        self.mean_bias = float(np.mean(X - y))
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        if len(X.shape) > 1:
            x_val = X[:, 0]
        else:
            x_val = X
            
        corrected = x_val - self.mean_bias
        
        # Rainfall cannot be negative
        corrected = np.maximum(corrected, 0.0)
        return corrected
        
    def save(self, filepath: str) -> None:
        joblib.dump({'mean_bias': self.mean_bias}, filepath)
        
    def load(self, filepath: str) -> None:
        data = joblib.load(filepath)
        self.mean_bias = data['mean_bias']
