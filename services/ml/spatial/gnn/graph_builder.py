import torch
import numpy as np
import logging
try:
    from torch_geometric.data import Data, Batch
except ImportError:
    pass # Will be handled by the perception layer toggle

logger = logging.getLogger(__name__)

class AtmosphericGraphBuilder:
    """
    Constructs PyTorch Geometric Data objects from spatial grids, linking adjacent 
    grid cells to model advective atmospheric transport.
    """
    def __init__(self, grid_height: int = 135, grid_width: int = 129):
        self.height = grid_height
        self.width = grid_width
        self.num_nodes = grid_height * grid_width
        
        # Pre-compute a geometric adjacency fallback (sparse edge index)
        # using a simple 4-connected (von Neumann) neighborhood.
        edges = []
        for i in range(grid_height):
            for j in range(grid_width):
                node_idx = i * grid_width + j
                if i > 0:
                    edges.append([node_idx, (i - 1) * grid_width + j])
                if i < grid_height - 1:
                    edges.append([node_idx, (i + 1) * grid_width + j])
                if j > 0:
                    edges.append([node_idx, i * grid_width + (j - 1)])
                if j < grid_width - 1:
                    edges.append([node_idx, i * grid_width + (j + 1)])
        
        # Shape: (2, num_edges)
        self.geometric_edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()

    def build_graph(self, 
                    node_features: torch.Tensor, 
                    wind_u: torch.Tensor = None, 
                    wind_v: torch.Tensor = None,
                    pressure_grad: torch.Tensor = None) -> 'Data':
        """
        Builds a spatial graph for a single time step.
        
        Args:
            node_features: (num_nodes, features)
            wind_u, wind_v, pressure_grad: Optional dynamic variables to construct physical edges.
        """
        num_nodes = node_features.shape[0]
        if num_nodes != self.num_nodes:
            raise ValueError(f"Expected {self.num_nodes} nodes, got {num_nodes}")

        edge_index = self.geometric_edge_index
        num_edges = edge_index.shape[1]
        
        # Edge features
        edge_attr = []
        fallback_used = False
        
        if wind_u is None or wind_v is None:
            logger.warning("Wind data unavailable. Falling back to purely geometric adjacency for GNN.")
            fallback_used = True
            # Fallback: [distance=1.0, u=0.0, v=0.0]
            edge_attr = torch.zeros((num_edges, 3), dtype=torch.float32)
            edge_attr[:, 0] = 1.0 
        else:
            # Construct physical transport edges based on wind vectors
            # Extract wind values at the source node of each edge
            src = edge_index[0]
            dst = edge_index[1]
            
            # Simple transport vectors
            u_src = wind_u[src]
            v_src = wind_v[src]
            
            # Directional alignment could be calculated here, but for now we pass raw vectors
            # distance=1.0 (assuming uniform grid)
            dist = torch.ones((num_edges, 1), dtype=torch.float32)
            
            if pressure_grad is not None:
                p_src = pressure_grad[src]
                edge_attr = torch.cat([dist, u_src.unsqueeze(1), v_src.unsqueeze(1), p_src.unsqueeze(1)], dim=1)
            else:
                edge_attr = torch.cat([dist, u_src.unsqueeze(1), v_src.unsqueeze(1)], dim=1)
                
        # PyG Data Object
        data = Data(x=node_features, edge_index=edge_index, edge_attr=edge_attr)
        data.fallback_used = fallback_used
        
        return data

    def build_batch(self, 
                    batched_node_features: torch.Tensor, 
                    batched_wind_u: torch.Tensor = None, 
                    batched_wind_v: torch.Tensor = None) -> 'Batch':
        """
        Constructs a disconnected block-diagonal Batch object for processing multiple samples at once.
        batched_node_features: (Batch, num_nodes, features)
        """
        batch_size = batched_node_features.shape[0]
        data_list = []
        
        for b in range(batch_size):
            u = batched_wind_u[b] if batched_wind_u is not None else None
            v = batched_wind_v[b] if batched_wind_v is not None else None
            data = self.build_graph(batched_node_features[b], u, v)
            data_list.append(data)
            
        return Batch.from_data_list(data_list)
