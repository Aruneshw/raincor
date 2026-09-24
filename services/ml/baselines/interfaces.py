from abc import ABC, abstractmethod
import numpy as np

class IModel(ABC):
    """
    Standard interface for all ML models and baseline correctors.
    """
    
    @abstractmethod
    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Trains the model.
        - X: NWP forecast features (e.g., shape [batch, features]) or [batch] for simple baselines
        - y: Observed truth (e.g., shape [batch])
        """
        pass
        
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predicts the corrected output given the NWP input.
        Returns array of shape [batch]
        """
        pass
        
    @abstractmethod
    def save(self, filepath: str) -> None:
        """Saves model parameters to disk."""
        pass
        
    @abstractmethod
    def load(self, filepath: str) -> None:
        """Loads model parameters from disk."""
        pass
