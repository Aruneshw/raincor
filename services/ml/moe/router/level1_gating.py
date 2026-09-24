import numpy as np
from typing import Dict, Any, List

class ErrorExpertRouter:
    """
    Level 1 Gating Network.
    Shared backbone that takes the comprehensive grid state and projects it 
    to logits for the 9 experts.
    """
    def __init__(self, input_dim: int = 20, num_experts: int = 9):
        self.input_dim = input_dim
        self.num_experts = num_experts
        
        # Placeholder for backbone weights. In production, this would be a 
        # trained neural network layer (e.g. PyTorch nn.Linear).
        # We initialize with random weights for the baseline.
        np.random.seed(42)
        self.W = np.random.randn(input_dim, num_experts) * 0.1
        self.b = np.zeros(num_experts)

    def extract_features(self, grid_state: Dict[str, Any]) -> np.ndarray:
        """
        Converts the rich grid dictionary into a fixed-size feature vector.
        Inputs include: Z (reflectivity/raw NWP), regime probabilities, 
        transition state, error mechanism vector, grid static features, 
        lead time, ensemble stats, memory state.
        """
        # For prototype, we generate a synthetic feature vector or extract
        # some keys if available.
        feat = np.zeros(self.input_dim)
        
        # In reality, we would extract:
        # feat[0:3] = grid_state.get('regime_probs')
        # feat[3:8] = grid_state.get('error_mechanisms')
        # ...
        
        # Simulate extracted features based on grid id to give deterministic 
        # but varied outputs for tests.
        grid_id = grid_state.get("grid_id", "0")
        hash_val = hash(grid_id) % 1000
        feat[0] = hash_val / 1000.0
        feat[1] = grid_state.get("lead_time_hours", 24) / 72.0
        
        return feat

    def forward(self, grid_states: List[Dict[str, Any]]) -> np.ndarray:
        """
        Computes the routing logits for a batch of grid states.
        
        Args:
            grid_states: List of dicts containing grid context.
            
        Returns:
            logits: Array of shape (batch_size, num_experts)
        """
        batch_size = len(grid_states)
        features = np.zeros((batch_size, self.input_dim))
        
        for i, state in enumerate(grid_states):
            features[i] = self.extract_features(state)
            
        # Standard Linear Backbone: X @ W + b
        logits = np.dot(features, self.W) + self.b
        return logits
