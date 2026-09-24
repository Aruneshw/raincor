import numpy as np
import time
import logging
from typing import Dict, Any, List

from services.ml.moe.sparse_routing.top_k_router import TopKRouter
from services.ml.moe.router.level1_gating import ErrorExpertRouter
from services.ml.moe.experts.expert_bank import create_expert_bank, BaseExpert

logger = logging.getLogger(__name__)

class HierarchicalMoEEngine:
    """
    Coordinates the RainMind Hierarchical Mixture-of-Experts.
    Level 1: Gating -> Sparse Routing (Top K).
    Level 2: Method Selector inside chosen experts.
    """
    def __init__(self, k: int = 2):
        self.k = k
        self.expert_bank = create_expert_bank()
        self.router = ErrorExpertRouter(num_experts=len(self.expert_bank))
        self.top_k_router = TopKRouter(k=self.k)
        
    def forward(self, x: np.ndarray, grid_states: List[Dict[str, Any]]) -> np.ndarray:
        """
        Executes the MoE forward pass for a batch of grids.
        
        Args:
            x: Raw model predictions/input tensor, shape (batch_size, input_dim).
            grid_states: List of dicts with length batch_size containing context.
            
        Returns:
            final_output: Corrected tensor, shape (batch_size, output_dim).
        """
        start_time = time.perf_counter()
        batch_size = x.shape[0]
        
        if len(grid_states) != batch_size:
            raise ValueError("Length of grid_states must match batch size of x.")
            
        # 1. Level 1 Gating: Compute routing logits
        logits = self.router.forward(grid_states)
        
        # 2. Sparse Routing: Get Top-K experts and weights
        top_k_indices, top_k_probs = self.top_k_router.route(logits)
        
        final_output = np.zeros_like(x, dtype=float)
        
        # 3. Dispatch to Experts and combine (Level 2 happens inside experts)
        # Note: We iterate over the batch for simplicity here. In a highly 
        # optimized C++/CUDA environment, we would group inputs by expert index.
        expert_calls = 0
        for b in range(batch_size):
            combined_pred = np.zeros_like(x[b], dtype=float)
            
            for k_idx in range(self.k):
                expert_idx = top_k_indices[b, k_idx]
                weight = top_k_probs[b, k_idx]
                
                expert = self.expert_bank[expert_idx]
                
                try:
                    # Pass the single instance (reshaped to batch=1)
                    # The expert internal selector will run based on grid_states[b]
                    expert_pred = expert.forward(
                        x[b:b+1], 
                        [grid_states[b]]
                    )[0]
                    expert_calls += 1
                except Exception as e:
                    logger.warning(f"Expert {expert.name} failed for grid {grid_states[b].get('grid_id')}: {e}. Using fallback.")
                    # Fallback to uncorrected x if expert fails
                    expert_pred = x[b]
                    
                combined_pred += expert_pred * weight
                
            final_output[b] = combined_pred
            
        end_time = time.perf_counter()
        inference_time_ms = (end_time - start_time) * 1000
        
        # Measure inference complexity proxy
        complexity = {
            "batch_size": batch_size,
            "expert_calls": expert_calls,
            "inference_time_ms": inference_time_ms,
            "ms_per_grid": inference_time_ms / max(1, batch_size)
        }
        
        # We could attach complexity to the object or return it, 
        # here we attach to self for test introspection
        self.last_complexity = complexity
        
        return final_output
