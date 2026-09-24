import torch
import torch.nn as nn

class RegionalEncoder(nn.Module):
    """
    Extracts regional spatial features using CNN layers over a 
    wider 5x5 synoptic receptive field around the target grid cell.
    Input shape expected: (Batch, Channels, 5, 5) or (Batch, Time, Channels, 5, 5)
    Output shape: (Batch, out_channels) or (Batch, Time, out_channels)
    """
    def __init__(self, in_channels: int, hidden_channels: int = 32, out_channels: int = 64):
        super().__init__()
        # Two 3x3 Conv layers without padding on a 5x5 input reduce the spatial 
        # dimensions: 5x5 -> 3x3 -> 1x1. This captures hierarchical spatial relationships.
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, hidden_channels, kernel_size=3, padding=0), # Output: 3x3
            nn.BatchNorm2d(hidden_channels),
            nn.ReLU(),
            nn.Conv2d(hidden_channels, out_channels, kernel_size=3, padding=0), # Output: 1x1
            nn.BatchNorm2d(out_channels),
            nn.ReLU(),
            nn.Flatten() # Flattens to 1D feature vector
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape (..., C, 5, 5)
        """
        if x.shape[-2:] != (5, 5):
            raise ValueError(f"RegionalEncoder expects spatial dims (5, 5), got {x.shape[-2:]}")
            
        if len(x.shape) == 5:
            b, t, c, h, w = x.shape
            x = x.view(b * t, c, h, w)
            out = self.conv(x)
            return out.view(b, t, -1)
            
        return self.conv(x)
