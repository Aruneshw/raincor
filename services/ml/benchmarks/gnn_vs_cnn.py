import torch
import time
import logging

from spatial.perception import SpatioTemporalPerception

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def count_parameters(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

def run_benchmark():
    logger.info("Initializing Benchmark: CNN vs CNN+GNN")
    
    batch_size = 2
    seq_len = 4
    channels = 8
    nodes = 135 * 129
    
    # Mock inputs
    logger.info(f"Generating mock tensors for Batch={batch_size}, Time={seq_len}, Nodes={nodes}")
    x_local = torch.randn(batch_size, seq_len, channels, 3, 3)
    x_regional = torch.randn(batch_size, seq_len, channels, 5, 5)
    static_vars = torch.randn(batch_size, 1, 6)
    regime_probs = torch.randn(batch_size, seq_len, 3)
    
    x_full_grid = torch.randn(batch_size, seq_len, nodes, channels)
    wind_u = torch.randn(batch_size, seq_len, nodes)
    wind_v = torch.randn(batch_size, seq_len, nodes)
    
    # Model 1: CNN Only
    cnn_model = SpatioTemporalPerception(
        dynamic_channels=channels,
        static_dim=6,
        regime_dim=3,
        use_gnn=False
    )
    
    # Model 2: CNN + GNN
    gnn_model = SpatioTemporalPerception(
        dynamic_channels=channels,
        static_dim=6,
        regime_dim=3,
        use_gnn=True,
        gnn_edge_dim=3
    )
    
    logger.info(f"CNN-Only Parameters: {count_parameters(cnn_model):,}")
    logger.info(f"CNN+GNN Parameters: {count_parameters(gnn_model):,}")
    
    # Warmup
    _ = cnn_model(x_local, x_regional, static_vars, regime_probs)
    _ = gnn_model(x_local, x_regional, static_vars, regime_probs, x_full_grid, wind_u, wind_v)
    
    # Timing CNN
    t0 = time.time()
    for _ in range(5):
        _ = cnn_model(x_local, x_regional, static_vars, regime_probs)
    cnn_time = (time.time() - t0) / 5.0
    
    # Timing GNN
    t0 = time.time()
    for _ in range(5):
        _ = gnn_model(x_local, x_regional, static_vars, regime_probs, x_full_grid, wind_u, wind_v)
    gnn_time = (time.time() - t0) / 5.0
    
    logger.info(f"CNN-Only Forward Pass: {cnn_time*1000:.2f} ms / batch")
    logger.info(f"CNN+GNN Forward Pass: {gnn_time*1000:.2f} ms / batch")
    logger.info("NOTE: These benchmark metrics only measure computational skill, not actual forecast skill.")

if __name__ == "__main__":
    run_benchmark()
