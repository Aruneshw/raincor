import pytest
import torch
from spatial.perception import SpatioTemporalPerception

def test_perception_layer_shapes():
    """Verify that the spatio-temporal pipeline correctly transforms multi-dimensional batches."""
    batch_size = 4
    seq_len = 5
    channels = 10
    static_dim = 6
    regime_dim = 3
    
    # Mock inputs
    x_local = torch.randn(batch_size, seq_len, channels, 3, 3)
    x_regional = torch.randn(batch_size, seq_len, channels, 5, 5)
    static_vars = torch.randn(batch_size, 1, static_dim) # Static doesn't change over time
    regime_probs = torch.randn(batch_size, seq_len, regime_dim)
    
    model = SpatioTemporalPerception(
        dynamic_channels=channels,
        static_dim=static_dim,
        regime_dim=regime_dim,
        local_out_dim=32,
        regional_out_dim=64,
        fused_dim=128,
        temporal_hidden_dim=128,
        num_attention_heads=4
    )
    
    # Forward pass
    outputs = model(x_local, x_regional, static_vars, regime_probs)
    
    assert "Z" in outputs
    assert "local_embedding" in outputs
    assert "regional_embedding" in outputs
    assert "temporal_embedding" in outputs
    
    # Z should be aggregated over time: (Batch, Hidden)
    assert outputs["Z"].shape == (batch_size, 128)
    
    # Intermediates should preserve time: (Batch, Time, Emb)
    assert outputs["local_embedding"].shape == (batch_size, seq_len, 32)
    assert outputs["regional_embedding"].shape == (batch_size, seq_len, 64)
    assert outputs["temporal_embedding"].shape == (batch_size, seq_len, 128)

def test_perception_layer_differentiability():
    """Verify that gradients can flow backwards from Z to the inputs."""
    batch_size = 2
    seq_len = 3
    channels = 5
    
    x_local = torch.randn(batch_size, seq_len, channels, 3, 3, requires_grad=True)
    x_regional = torch.randn(batch_size, seq_len, channels, 5, 5, requires_grad=True)
    static_vars = torch.randn(batch_size, 1, 2, requires_grad=True)
    regime_probs = torch.randn(batch_size, seq_len, 3, requires_grad=True)
    
    model = SpatioTemporalPerception(
        dynamic_channels=channels,
        static_dim=2,
        regime_dim=3
    )
    
    outputs = model(x_local, x_regional, static_vars, regime_probs)
    
    # Dummy loss
    loss = outputs["Z"].sum()
    loss.backward()
    
    # Check that gradients were populated
    assert x_local.grad is not None
    assert x_regional.grad is not None
    assert static_vars.grad is not None
    assert regime_probs.grad is not None
