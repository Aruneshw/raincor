import numpy as np
from .interfaces import IModel

class RawNWPBaseline(IModel):
    """
    A passthrough model that outputs the exact NWP prediction 
    without any correction. Used as the absolute baseline.
    """
    
    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        # No training required for raw NWP passthrough
        pass
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        # Assumes X is 1D (the NWP forecast for a specific variable) 
        # or X[:, 0] contains the primary variable if 2D.
        if len(X.shape) > 1:
            return X[:, 0]
        return X
        
    def save(self, filepath: str) -> None:
        # Nothing to save
        pass
        
    def load(self, filepath: str) -> None:
        # Nothing to load
        pass
