import pytest
import torch
import sys

from spatial.perception import SpatioTemporalPerception
try:
    from spatial.gnn.graph_builder import AtmosphericGraphBuilder
    from spatial.gnn.transport_layer import AtmosphericTransportGNN
except ImportError:
    pass

@pytest.mark.skipif("torch_geometric" not in sys.modules, reason="PyG not installed")
def test_graph_builder_fallback():
    builder = AtmosphericGraphBuilder(grid_height=4, grid_width=4)
    nodes = torch.randn(16, 5) # 4x4 grid
    
    # Missing wind triggers fallback
    graph = builder.build_graph(nodes, wind_u=None, wind_v=None)
    
    assert graph.fallback_used is True
    assert graph.edge_attr.shape[1] == 3 # distance, u, v
    assert (graph.edge_attr[:, 0] == 1.0).all() # distance fallback is 1.0
    assert (graph.edge_attr[:, 1:] == 0.0).all() # wind fallback is 0.0

@pytest.mark.skipif("torch_geometric" not in sys.modules, reason="PyG not installed")
def test_perception_with_gnn():
    batch_size = 2
    seq_len = 3
    channels = 5
    nodes = 4 * 4
    
    # Mock inputs
    x_local = torch.randn(batch_size, seq_len, channels, 3, 3)
    x_regional = torch.randn(batch_size, seq_len, channels, 5, 5)
    static_vars = torch.randn(batch_size, 1, 2)
    regime_probs = torch.randn(batch_size, seq_len, 3)
    
    x_full = torch.randn(batch_size, seq_len, nodes, channels)
    wind_u = torch.randn(batch_size, seq_len, nodes)
    wind_v = torch.randn(batch_size, seq_len, nodes)
    
    # Needs to match graph builder sizes inside perception if not mocked, 
    # but SpatioTemporalPerception initializes AtmosphericGraphBuilder with default 135x129.
    # We will just test the graph builder separately and patch SpatioTemporalPerception's builder
    model = SpatioTemporalPerception(
        dynamic_channels=channels,
        static_dim=2,
        regime_dim=3,
        use_gnn=True,
        gnn_edge_dim=3,
        gnn_out_dim=32
    )
    
    # Patch the graph builder for testing with small grid
    model.graph_builder = AtmosphericGraphBuilder(grid_height=4, grid_width=4)
    
    outputs = model(
        x_local, x_regional, static_vars, regime_probs,
        x_full_grid=x_full, wind_u=wind_u, wind_v=wind_v
    )
    
    assert "spatial_graph_embedding" in outputs
    assert "neighbor_influence_score" in outputs
    assert "transport_aware_context" in outputs
    assert "Z" in outputs
    
    assert outputs["Z"].shape == (batch_size, 128)
