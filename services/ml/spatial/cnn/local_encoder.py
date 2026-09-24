import torch
import torch.nn as nn

class LocalEncoder(nn.Module):
    """
    Extracts local spatial features using a 3x3 Convolution over the 
    immediate neighbouring grid cells.
    Input shape expected: (Batch * Time, Channels, 3, 3) or (Batch, Channels, 3, 3)
    Output shape: (Batch * Time, out_channels)
    """
    def __init__(self, in_channels: int, out_channels: int = 32):
        super().__init__()
        # Since input is exactly 3x3, a 3x3 Conv with padding=0 reduces it to 1x1 spatially
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=0),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(),
            nn.Flatten() # Flattens the (B, out_channels, 1, 1) into (B, out_channels)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape (..., C, 3, 3)
        """
        if x.shape[-2:] != (3, 3):
            raise ValueError(f"LocalEncoder expects spatial dims (3, 3), got {x.shape[-2:]}")
            
        # Handle cases where input includes a Time dimension by flattening Batch*Time
        original_shape = x.shape
        if len(x.shape) == 5:
            # (B, T, C, H, W) -> (B*T, C, H, W)
            b, t, c, h, w = x.shape
            x = x.view(b * t, c, h, w)
            out = self.conv(x)
            return out.view(b, t, -1)
        
        return self.conv(x)
