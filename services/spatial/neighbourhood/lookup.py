from typing import List, Tuple
from grid.engine import SpatialGrid

class NeighbourhoodEngine:
    def __init__(self, grid: SpatialGrid):
        self.grid = grid

    def get_nxn_neighbourhood(self, grid_id: str, n: int) -> List[str]:
        """
        Returns stable Grid IDs for an NxN neighbourhood around the target grid_id.
        Ensures bounding checks are enforced (drops invalid neighbors at the edges).
        n must be an odd integer (e.g., 3 or 5).
        """
        if n % 2 == 0:
            raise ValueError("Neighbourhood size 'n' must be odd.")
            
        record = self.grid._id_to_record.get(grid_id)
        if not record:
            raise ValueError(f"Unknown Grid ID: {grid_id}")
            
        offset = n // 2
        neighbours = []
        
        for di in range(-offset, offset + 1):
            for dj in range(-offset, offset + 1):
                ni = record.i + di
                nj = record.j + dj
                
                # Bounding checks
                if 0 <= ni < self.grid.n_lat and 0 <= nj < self.grid.n_lon:
                    neighbours.append(self.grid.index_to_id(ni, nj))
                    
        return neighbours

    def get_3x3(self, grid_id: str) -> List[str]:
        return self.get_nxn_neighbourhood(grid_id, 3)

    def get_5x5(self, grid_id: str) -> List[str]:
        return self.get_nxn_neighbourhood(grid_id, 5)
        
    def get_within_distance(self, grid_id: str, distance_km: float) -> List[str]:
        """
        Finds all neighbours within a specific radius using the internal KDTree.
        Requires projecting distance roughly, but since our coordinates are lat/lon, 
        we use the cKDTree with a query_ball_point approximation or re-project.
        
        For exact Haversine, it's better to filter the bounding box.
        """
        record = self.grid._id_to_record[grid_id]
        # Approximation: 1 degree latitude is ~111 km.
        degree_radius = distance_km / 111.0
        
        # Query KDTree for fast retrieval
        indices = self.grid._kdtree.query_ball_point([record.lat, record.lon], r=degree_radius)
        
        # Convert indices to Grid IDs
        records = list(self.grid._id_to_record.values())
        return [records[idx].grid_id for idx in indices]
