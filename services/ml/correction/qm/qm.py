import numpy as np
import joblib
from scipy.interpolate import interp1d
from baselines.interfaces import IModel

class EmpiricalQuantileMapping(IModel):
    """
    Empirical Quantile Mapping (EQM).
    Constructs the Empirical CDF (ECDF) for both NWP and Observations during training.
    During prediction, maps the NWP value to its CDF percentile, and extracts the 
    corresponding value from the Observation inverse-CDF (quantile function).
    """
    
    def __init__(self, n_quantiles: int = 100):
        self.n_quantiles = n_quantiles
        self.quantiles = np.linspace(0, 1, self.n_quantiles)
        self.nwp_quantiles = None
        self.obs_quantiles = None
        
        # Interpolators for fast inference
        self._forward_mapping = None
        self._inverse_mapping = None

    def train(self, X: np.ndarray, y: np.ndarray) -> None:
        """
        Fits the empirical CDFs.
        X: NWP predictions (1D)
        y: Observed truth (1D)
        """
        if len(X.shape) > 1:
            X = X[:, 0]
            
        # Calculate empirical quantiles for both distributions
        self.nwp_quantiles = np.quantile(X, self.quantiles)
        self.obs_quantiles = np.quantile(y, self.quantiles)
        
        # Build mapping function: NWP value -> Obs value
        # We ensure it's monotonically increasing for interp1d
        # We use fill_value="extrapolate" to handle extremes beyond training data
        self._forward_mapping = interp1d(
            self.nwp_quantiles, 
            self.obs_quantiles, 
            kind='linear', 
            bounds_error=False, 
            fill_value="extrapolate"
        )
        
        # Build inverse mapping: Obs value -> NWP value (useful for backward derivations)
        self._inverse_mapping = interp1d(
            self.obs_quantiles, 
            self.nwp_quantiles, 
            kind='linear', 
            bounds_error=False, 
            fill_value="extrapolate"
        )

    def predict(self, X: np.ndarray) -> np.ndarray:
        if self._forward_mapping is None:
            raise RuntimeError("Model must be trained before calling predict()")
            
        if len(X.shape) > 1:
            x_val = X[:, 0]
        else:
            x_val = X
            
        corrected = self._forward_mapping(x_val)
        
        # Physical constraints (e.g., rainfall >= 0)
        corrected = np.maximum(corrected, 0.0)
        return corrected
        
    def inverse_map(self, y: np.ndarray) -> np.ndarray:
        """Maps an observed value back to what the NWP *would* have predicted."""
        if self._inverse_mapping is None:
            raise RuntimeError("Model must be trained before calling inverse_map()")
            
        nwp_equiv = self._inverse_mapping(y)
        return np.maximum(nwp_equiv, 0.0)
        
    def save(self, filepath: str) -> None:
        if self.nwp_quantiles is None or self.obs_quantiles is None:
            raise RuntimeError("Cannot save an untrained model.")
            
        state = {
            'n_quantiles': self.n_quantiles,
            'quantiles': self.quantiles,
            'nwp_quantiles': self.nwp_quantiles,
            'obs_quantiles': self.obs_quantiles
        }
        joblib.dump(state, filepath)
        
    def load(self, filepath: str) -> None:
        state = joblib.load(filepath)
        self.n_quantiles = state['n_quantiles']
        self.quantiles = state['quantiles']
        self.nwp_quantiles = state['nwp_quantiles']
        self.obs_quantiles = state['obs_quantiles']
        
        # Rebuild interpolators
        self._forward_mapping = interp1d(
            self.nwp_quantiles, self.obs_quantiles, 
            kind='linear', bounds_error=False, fill_value="extrapolate"
        )
        self._inverse_mapping = interp1d(
            self.obs_quantiles, self.nwp_quantiles, 
            kind='linear', bounds_error=False, fill_value="extrapolate"
        )
