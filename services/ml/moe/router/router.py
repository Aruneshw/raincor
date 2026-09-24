import torch
import torch.nn as nn
import torch.nn.functional as F

class ErrorExpertRouter(nn.Module):
    def __init__(self, input_dim: int, num_experts: int, top_k: int = 2):
        """
        Level 1: Error Expert Gating
        """
        super().__init__()
        self.num_experts = num_experts
        self.top_k = min(top_k, num_experts)
        
        # Inputs: Z, regime probs, transition state, error mechanism, 
        # grid static features, lead time, ensemble stats, memory state
        self.routing_network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.LayerNorm(128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.LayerNorm(64),
            nn.ReLU(),
            nn.Linear(64, num_experts)
        )
        
    def forward(self, routing_inputs: torch.Tensor):
        """
        routing_inputs shape: (batch_size, num_grids, input_dim)
        """
        logits = self.routing_network(routing_inputs)
        routing_probs = F.softmax(logits, dim=-1)
        
        top_k_probs, top_k_indices = torch.topk(routing_probs, self.top_k, dim=-1)
        
        # Normalize top-k probabilities to sum to 1
        top_k_probs = top_k_probs / (top_k_probs.sum(dim=-1, keepdim=True) + 1e-9)
        
        return routing_probs, top_k_probs, top_k_indices
