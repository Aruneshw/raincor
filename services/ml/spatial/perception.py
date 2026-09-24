import torch
import torch.nn as nn
from typing import Dict

from .cnn.local_encoder import LocalEncoder
from .cnn.regional_encoder import RegionalEncoder
from .multiscale.fusion import SpatialFusion
from .temporal.recurrent import TemporalEncoder
from .temporal.attention import GlobalContextAttention

try:
    from .gnn.graph_builder import AtmosphericGraphBuilder
    from .gnn.transport_layer import AtmosphericTransportGNN
except ImportError:
    AtmosphericGraphBuilder = None
    AtmosphericTransportGNN = None


class SpatioTemporalPerception(nn.Module):
    """
    The unified perception layer for RainMind.
    Processes batched multi-dimensional inputs into a rich latent representation Z.
    Optionally includes a PyTorch Geometric GNN layer to model physical transport.
    """
    def __init__(self, 
                 dynamic_channels: int, 
                 static_dim: int, 
                 regime_dim: int,
                 local_out_dim: int = 32,
                 regional_out_dim: int = 64,
                 fused_dim: int = 128,
                 temporal_hidden_dim: int = 128,
                 num_attention_heads: int = 4,
                 use_gnn: bool = False,
                 gnn_edge_dim: int = 3,
                 gnn_out_dim: int = 32):
        super().__init__()
        
        self.use_gnn = use_gnn
        if self.use_gnn and AtmosphericTransportGNN is None:
            raise ImportError("PyTorch Geometric is not installed, cannot use_gnn=True")

        # 1. Spatial Encoders
        self.local_encoder = LocalEncoder(in_channels=dynamic_channels, out_channels=local_out_dim)
        self.regional_encoder = RegionalEncoder(in_channels=dynamic_channels, out_channels=regional_out_dim)
        
        fusion_in_dim = local_out_dim + regional_out_dim
        
        # Initialize GNN if configured
        if self.use_gnn:
            self.graph_builder = AtmosphericGraphBuilder()
            self.gnn = AtmosphericTransportGNN(
                node_in_channels=dynamic_channels,
                edge_in_channels=gnn_edge_dim,
                out_channels=gnn_out_dim
            )
            fusion_in_dim += gnn_out_dim
            
        # 2. Multi-scale Aggregation
        # Modified fusion to accept the dynamically sized input based on use_gnn
        self.fusion = nn.Sequential(
            nn.Linear(fusion_in_dim + static_dim + regime_dim, fused_dim),
            nn.LayerNorm(fused_dim),
            nn.ReLU(),
            nn.Linear(fused_dim, fused_dim),
            nn.LayerNorm(fused_dim),
            nn.ReLU()
        )
        
        # 3. Temporal Encoder
        self.temporal_encoder = TemporalEncoder(
            input_dim=fused_dim, 
            hidden_dim=temporal_hidden_dim
        )
        
        # 4. Global Context Attention
        self.attention = GlobalContextAttention(
            embed_dim=temporal_hidden_dim, 
            num_heads=num_attention_heads
        )
        
    def forward(self, 
                x_local_3x3: torch.Tensor, 
                x_regional_5x5: torch.Tensor, 
                static_vars: torch.Tensor, 
                regime_probs: torch.Tensor,
                # New optional GNN inputs
                x_full_grid: torch.Tensor = None,
                wind_u: torch.Tensor = None,
                wind_v: torch.Tensor = None) -> Dict[str, torch.Tensor]:
        
        # 1. Extract Spatial Features
        local_emb = self.local_encoder(x_local_3x3)
        regional_emb = self.regional_encoder(x_regional_5x5)
        
        if static_vars.shape[1] == 1 and local_emb.shape[1] > 1:
            static_vars = static_vars.expand(-1, local_emb.shape[1], -1)
            
        # Compile features for fusion
        fusion_components = [local_emb, regional_emb]
        
        gnn_results = {}
        if self.use_gnn:
            if x_full_grid is None:
                raise ValueError("x_full_grid must be provided when use_gnn is True")
            
            # GNN operates per time step. For simplicity in MVP, we process the 
            # last time step or loop over them. Here we process the current batch.
            # Assuming x_full_grid is (Batch, Nodes, Features). If time is included, loop it.
            # For this MVP, we'll flatten Batch*Time just like the CNNs, then reshape.
            if len(x_full_grid.shape) == 4:
                b, t, nodes, feats = x_full_grid.shape
                x_full_flat = x_full_grid.view(b*t, nodes, feats)
                w_u = wind_u.view(b*t, nodes) if wind_u is not None else None
                w_v = wind_v.view(b*t, nodes) if wind_v is not None else None
            else:
                b, nodes, feats = x_full_grid.shape
                t = 1
                x_full_flat = x_full_grid
                w_u = wind_u
                w_v = wind_v
                
            batch_data = self.graph_builder.build_batch(x_full_flat, w_u, w_v)
            gnn_out = self.gnn(batch_data)
            
            # Use the pooled graph context vector for fusion, which has shape (b*t, out_channels)
            spatial_graph_emb = gnn_out["transport_aware_context"]
            # Reshape back to (Batch, Time, Emb)
            spatial_graph_emb = spatial_graph_emb.view(b, t, -1)
            fusion_components.append(spatial_graph_emb)
            gnn_results = gnn_out
            
        fusion_components.extend([static_vars, regime_probs])
        
        # 2. Fuse
        fused_input = torch.cat(fusion_components, dim=-1)
        spatial_fused = self.fusion(fused_input)
        
        # 3. Temporal Recurrence
        temporal_emb = self.temporal_encoder(spatial_fused)
        
        # 4. Global Context Attention
        Z = self.attention(temporal_emb)
        
        output = {
            "Z": Z,
            "local_embedding": local_emb,
            "regional_embedding": regional_emb,
            "temporal_embedding": temporal_emb
        }
        output.update(gnn_results)
        return output
