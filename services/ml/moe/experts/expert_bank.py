import torch
import torch.nn as nn
from typing import List
from services.ml.moe.method_selector.selector import MethodSelector

class Expert(nn.Module):
    def __init__(self, name: str, input_dim: int, feature_dim: int, methods: List[str]):
        super().__init__()
        self.name = name
        self.method_selector = MethodSelector(methods, input_dim)
        
        # Create lightweight mock heads for each method
        self.method_heads = nn.ModuleDict({
            method: nn.Linear(feature_dim, 1) for method in methods
        })
        
    def forward(self, x: torch.Tensor, features: torch.Tensor):
        """
        x: original inputs (used by method selector)
        features: shared backbone features
        """
        method_probs = self.method_selector(x)
        
        outputs = []
        for method_name in self.method_selector.methods:
            method_out = self.method_heads[method_name](features)
            outputs.append(method_out)
            
        outputs = torch.cat(outputs, dim=-1) # (batch, ..., num_methods)
        
        # Blend method outputs
        weighted_output = (outputs * method_probs).sum(dim=-1, keepdim=True)
        return weighted_output

class ExpertBank(nn.Module):
    def __init__(self, expert_names: List[str], methods: List[str], input_dim: int, backbone_dim: int = 32):
        super().__init__()
        self.expert_names = expert_names
        
        # Shared backbone for all experts
        self.shared_backbone = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, backbone_dim),
            nn.ReLU()
        )
        
        self.experts = nn.ModuleDict({
            name: Expert(name, input_dim, backbone_dim, methods)
            for name in expert_names
        })
            
    def forward_expert(self, expert_name: str, x: torch.Tensor):
        features = self.shared_backbone(x)
        return self.experts[expert_name](x, features)
