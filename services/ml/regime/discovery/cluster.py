import numpy as np
import hdbscan
from sklearn.mixture import GaussianMixture
from typing import Dict, Any, Tuple

class RegimeDiscoverer:
    """
    Phase A: Unsupervised Discovery of Meteorological Regimes.
    Uses GMM or HDBSCAN to find latent clusters in the feature space.
    """
    def __init__(self, method: str = 'gmm', n_clusters: int = 5):
        self.method = method
        self.n_clusters = n_clusters
        self.model = None
        self.cluster_centers_ = None
        
    def fit(self, X: np.ndarray) -> np.ndarray:
        """Fits the clustering algorithm and returns cluster assignments."""
        if self.method == 'gmm':
            self.model = GaussianMixture(n_components=self.n_clusters, covariance_type='full', random_state=42)
            labels = self.model.fit_predict(X)
            self.cluster_centers_ = self.model.means_
        elif self.method == 'hdbscan':
            self.model = hdbscan.HDBSCAN(min_cluster_size=15, min_samples=5, prediction_data=True)
            labels = self.model.fit_predict(X)
            # HDBSCAN doesn't natively have "centers" like KMeans, we can calculate empirical medoids later if needed
            self.cluster_centers_ = None
        else:
            raise ValueError(f"Unknown discovery method: {self.method}")
            
        return labels

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Assigns new data to discovered clusters."""
        if self.model is None:
            raise RuntimeError("Must fit before predict.")
            
        if self.method == 'gmm':
            return self.model.predict(X)
        elif self.method == 'hdbscan':
            labels, _ = hdbscan.approximate_predict(self.model, X)
            return labels
