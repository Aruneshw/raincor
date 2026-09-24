import torch
import time
from typing import Dict, Tuple

def sparse_dispatch(x: torch.Tensor, top_k_indices: torch.Tensor, top_k_probs: torch.Tensor, expert_bank) -> Tuple[torch.Tensor, Dict]:
    """
    x: (batch_size, num_grids, feature_dim)
    top_k_indices: (batch_size, num_grids, top_k)
    top_k_probs: (batch_size, num_grids, top_k)
    expert_bank: ExpertBank module
    """
    start_time = time.time()
    
    # We can flatten batch_size and num_grids for easier processing
    original_shape = x.shape
    batch_grids = original_shape[0] * original_shape[1]
    
    x_flat = x.view(batch_grids, -1)
    indices_flat = top_k_indices.view(batch_grids, -1)
    probs_flat = top_k_probs.view(batch_grids, -1)
    
    out_flat = torch.zeros((batch_grids, 1), device=x.device)
    
    expert_calls = 0
    expert_names = expert_bank.expert_names
    
    # Process each expert
    for i, expert_name in enumerate(expert_names):
        # Find which inputs selected this expert
        mask = (indices_flat == i)
        
        # Determine if this expert is selected at all for any grid
        grid_mask = mask.any(dim=-1)
        
        if grid_mask.any():
            # Get inputs for this expert
            expert_inputs = x_flat[grid_mask]
            
            # Execute expert
            expert_outputs = expert_bank.forward_expert(expert_name, expert_inputs)
            
            expert_calls += expert_inputs.shape[0]
            
            # Extract probabilities
            # mask[grid_mask] gives the (N_selected, top_k) boolean mask for this expert
            # probs_flat[grid_mask] gives the (N_selected, top_k) probs
            selected_probs = (probs_flat[grid_mask] * mask[grid_mask]).sum(dim=-1)
            
            # Weight outputs by routing probabilities
            weighted_outputs = expert_outputs * selected_probs.unsqueeze(-1)
            
            # Accumulate in output tensor
            out_flat[grid_mask] += weighted_outputs
            
    end_time = time.time()
    
    # Reshape output back to (batch_size, num_grids, 1)
    out = out_flat.view(original_shape[0], original_shape[1], 1)
    
    complexity = {
        'expert_calls': expert_calls,
        'total_possible_calls': batch_grids * len(expert_names),
        'sparsity_ratio': 1.0 - (expert_calls / (batch_grids * len(expert_names))),
        'inference_time_ms': (end_time - start_time) * 1000
    }
    
    return out, complexity
