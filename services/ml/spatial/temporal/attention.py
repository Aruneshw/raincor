import torch
import torch.nn as nn

class GlobalContextAttention(nn.Module):
    """
    Applies Multi-Head Self Attention over the temporal dimension to learn 
    which historical states matter most for the current forecast, producing 
    the final latent representation Z.
    """
    def __init__(self, embed_dim: int, num_heads: int = 4):
        super().__init__()
        # batch_first=True expects (Batch, Time, Features)
        self.attention = nn.MultiheadAttention(embed_dim=embed_dim, num_heads=num_heads, batch_first=True)
        self.layer_norm = nn.LayerNorm(embed_dim)
        
        # Learnable query vector that acts as a summarization token (like a [CLS] token)
        # We will use this to query the temporal sequence.
        self.query_token = nn.Parameter(torch.randn(1, 1, embed_dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: Tensor of shape (Batch, Time, Features)
        Returns:
            Z: Tensor of shape (Batch, Features)
        """
        batch_size = x.shape[0]
        
        # Expand the learnable query token to match the batch size
        # Shape: (Batch, 1, Features)
        q = self.query_token.expand(batch_size, -1, -1)
        
        # Keys and Values are the temporal hidden states
        # k, v shape: (Batch, Time, Features)
        k = v = x
        
        # Compute Attention
        # attn_out shape: (Batch, 1, Features)
        attn_out, _ = self.attention(query=q, key=k, value=v)
        
        # Squeeze out the sequence dimension (1) since it's just the aggregated context
        Z = attn_out.squeeze(1)
        
        # Apply layer normalization for stable gradients
        Z = self.layer_norm(Z)
        
        return Z
