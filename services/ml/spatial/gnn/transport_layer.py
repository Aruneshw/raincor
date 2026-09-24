import torch
import torch.nn as nn
import torch.nn.functional as F
import logging

try:
    from torch_geometric.nn import GATv2Conv, global_mean_pool
    from torch_geometric.data import Batch, Data
except ImportError:
    pass

logger = logging.getLogger(__name__)

class AtmosphericTransportGNN(nn.Module):
    """
    Message Passing neural network modeling the physical advection of 
    atmospheric variables across the grid. Uses GATv2 to calculate neighbor
    influence scores (attention) based on wind, pressure, and distance edge features.
    """
    def __init__(self, node_in_channels: int, edge_in_channels: int, 
                 hidden_channels: int = 64, out_channels: int = 64, heads: int = 2):
        super().__init__()
        
        # GATv2Conv natively supports edge_attr in message passing, 
        # allowing wind vectors to modulate neighbor influence.
        self.conv1 = GATv2Conv(
            in_channels=node_in_channels,
            out_channels=hidden_channels,
            heads=heads,
            edge_dim=edge_in_channels,
            concat=True
        )
        
        self.conv2 = GATv2Conv(
            in_channels=hidden_channels * heads,
            out_channels=out_channels,
            heads=1, # Average out heads in final layer
            edge_dim=edge_in_channels,
            concat=False
        )
        
        self.layer_norm = nn.LayerNorm(out_channels)
        
    def forward(self, data: 'Data') -> dict:
        """
        Forward pass over the PyG Data or Batch object.
        """
        x, edge_index, edge_attr = data.x, data.edge_index, data.edge_attr
        
        # We explicitly request attention weights to calculate the "Neighbor Influence Score"
        # return_attention_weights=True returns (edge_index, alpha)
        x_1, alpha_1 = self.conv1(x, edge_index, edge_attr, return_attention_weights=True)
        x_1 = F.elu(x_1)
        
        x_2, alpha_2 = self.conv2(x_1, edge_index, edge_attr, return_attention_weights=True)
        x_out = self.layer_norm(x_2)
        
        # Compute global graph context vector
        # If running batched, global_mean_pool correctly aggregates per-graph
        batch = data.batch if hasattr(data, 'batch') and data.batch is not None else torch.zeros(x.size(0), dtype=torch.long, device=x.device)
        context_vector = global_mean_pool(x_out, batch)
        
        return {
            "spatial_graph_embedding": x_out,
            "neighbor_influence_score": alpha_2[1], # The attention weights array
            "transport_aware_context": context_vector
        }
