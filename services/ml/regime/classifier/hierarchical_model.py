import numpy as np
from typing import Dict, Any
from .lgb_head import LGBRegimeHead
from scipy.stats import entropy

class HierarchicalRegimeClassifier:
    """
    Cascading Hierarchical Classifier for RainMind.
    Aggregates predictions from Season, Synoptic, and Local Modifier Heads.
    Computes Regime Entropy and Overall Confidence.
    """
    def __init__(self, season_classes: int, synoptic_classes: int, local_classes: int):
        self.season_head = LGBRegimeHead(num_classes=season_classes)
        self.synoptic_head = LGBRegimeHead(num_classes=synoptic_classes)
        self.local_head = LGBRegimeHead(num_classes=local_classes)
        
    def train(self, X: np.ndarray, y_season: np.ndarray, y_synoptic: np.ndarray, y_local: np.ndarray, 
              season_weights=None, synoptic_weights=None, local_weights=None, num_boost_round=100):
        """
        Trains all three heads independently in parallel.
        In an advanced implementation, X for lower heads could include predictions from upper heads.
        """
        self.season_head.train(X, y_season, sample_weights=season_weights, num_boost_round=num_boost_round)
        self.synoptic_head.train(X, y_synoptic, sample_weights=synoptic_weights, num_boost_round=num_boost_round)
        self.local_head.train(X, y_local, sample_weights=local_weights, num_boost_round=num_boost_round)
        
    def predict(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Predicts probabilities across the hierarchy and calculates 
        information-theoretic uncertainty metrics.
        """
        season_probs = self.season_head.predict_proba(X)
        synoptic_probs = self.synoptic_head.predict_proba(X)
        local_probs = self.local_head.predict_proba(X)
        
        # Calculate entropy (uncertainty) per head using base 2
        # Higher entropy = flat distribution = model is highly uncertain / state is unknown
        season_entropy = entropy(season_probs, base=2, axis=1)
        synoptic_entropy = entropy(synoptic_probs, base=2, axis=1)
        local_entropy = entropy(local_probs, base=2, axis=1)
        
        # Overall Regime Entropy (Mean of all head entropies)
        overall_entropy = (season_entropy + synoptic_entropy + local_entropy) / 3.0
        
        # Confidence is inversely related to entropy. 
        # A simple proxy is the product of the max probabilities from each head.
        season_conf = np.max(season_probs, axis=1)
        synoptic_conf = np.max(synoptic_probs, axis=1)
        local_conf = np.max(local_probs, axis=1)
        
        overall_confidence = season_conf * synoptic_conf * local_conf
        
        return {
            "season_probabilities": season_probs,
            "synoptic_probabilities": synoptic_probs,
            "local_probabilities": local_probs,
            "entropy": overall_entropy,
            "confidence": overall_confidence
        }
