import numpy as np
from grid.engine import SpatialGrid

class LandOceanMask:
    """
    Adapter for applying a land/ocean mask to the SpatialGrid.
    In the absence of a real high-res boundary file, this defaults to 
    setting everything to land, or applying a generic synthetic mask.
    """
    def __init__(self, grid: SpatialGrid):
        self.grid = grid
        
    def apply_synthetic_mask(self):
        """
        Applies a basic bounding box mask as a placeholder for the real 
        India boundary. E.g., cutting off the bottom right ocean.
        """
        for record in self.grid._id_to_record.values():
            # Very crude heuristic just to show masking capability
            if record.lat < 15.0 and record.lon > 85.0:
                record.is_land = False
            else:
                record.is_land = True
                
    def apply_from_array(self, mask_array: np.ndarray):
        """
        Applies a loaded mask array (135x129 boolean array) to the grid records.
        """
        if mask_array.shape != (self.grid.n_lat, self.grid.n_lon):
            raise ValueError(f"Expected mask shape {(self.grid.n_lat, self.grid.n_lon)}, got {mask_array.shape}")
            
        for i in range(self.grid.n_lat):
            for j in range(self.grid.n_lon):
                grid_id = self.grid.index_to_id(i, j)
                self.grid._id_to_record[grid_id].is_land = bool(mask_array[i, j])
