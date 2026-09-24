import torch
import torch.nn as nn

class TemporalEncoder(nn.Module):
    """
    Extracts time-series dependencies from the spatial features using a GRU.
    """
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int = 1):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape (Batch, Time, Features)
        Returns:
            out: All hidden states, shape (Batch, Time, Hidden)
        """
        out, _ = self.gru(x)
        return out
