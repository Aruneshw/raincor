import torch
import torch.nn as nn

class SpatialFusion(nn.Module):
    """
    Fuses multi-scale spatial representations and scalar variables into a 
    single unified feature vector per time step.
    """
    def __init__(self, local_dim: int, regional_dim: int, static_dim: int, regime_dim: int, out_dim: int = 128):
        super().__init__()
        in_features = local_dim + regional_dim + static_dim + regime_dim
        
        self.mlp = nn.Sequential(
            nn.Linear(in_features, out_dim),
            nn.LayerNorm(out_dim),
            nn.ReLU(),
            nn.Linear(out_dim, out_dim),
            nn.LayerNorm(out_dim),
            nn.ReLU()
        )
        
    def forward(self, local_emb: torch.Tensor, regional_emb: torch.Tensor, 
                static_vars: torch.Tensor, regime_probs: torch.Tensor) -> torch.Tensor:
        """
        All inputs should have the same leading dimensions (Batch, [Time], Features)
        """
        # Concatenate along the feature dimension
        fused = torch.cat([local_emb, regional_emb, static_vars, regime_probs], dim=-1)
        return self.mlp(fused)
