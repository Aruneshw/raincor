import numpy as np
from typing import Tuple, List

class TopKRouter:
    """
    Implements Top-K Sparse Routing using a Softmax operation.
    Given raw logits from a gating network, it returns the top K experts
    and their corresponding routing probabilities, scaled such that they
    sum to 1.0 (or represent the true softmax mass).
    """
    def __init__(self, k: int = 2):
        self.k = k

    def route(self, logits: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Routes the input logits to the top-K experts.
        
        Args:
            logits: Array of shape (batch_size, num_experts)
            
        Returns:
            top_k_indices: Array of shape (batch_size, K) containing expert indices.
            top_k_probs: Array of shape (batch_size, K) containing routing weights.
        """
        # 1. Compute full Softmax (numerically stable)
        max_logits = np.max(logits, axis=-1, keepdims=True)
        exp_logits = np.exp(logits - max_logits)
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
        
        # 2. Extract Top K indices
        # np.argsort sorts in ascending order, so take the last K and reverse
        # For batch processing, we can use np.argpartition for efficiency on large num_experts, 
        # but argsort is fine for 9 experts.
        sorted_indices = np.argsort(probs, axis=-1)
        top_k_indices = sorted_indices[:, -self.k:][:, ::-1]
        
        # 3. Extract Top K probs
        batch_indices = np.arange(logits.shape[0])[:, None]
        top_k_probs = probs[batch_indices, top_k_indices]
        
        # 4. Normalize Top K probs so they sum to 1.0 
        # (Standard for MoE to ensure the output magnitude remains consistent)
        prob_sums = np.sum(top_k_probs, axis=-1, keepdims=True)
        # Avoid division by zero
        prob_sums[prob_sums == 0] = 1.0
        normalized_top_k_probs = top_k_probs / prob_sums
        
        return top_k_indices, normalized_top_k_probs
