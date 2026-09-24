import numpy as np
from typing import Tuple, Dict, Optional
from scipy.spatial import cKDTree
from .schemas import GridRecord, GridMetadata

class SpatialGrid:
    """
    Fixed India spatial grid engine.
    Base dimensions: 135 (lat) x 129 (lon) at 0.25 deg resolution.
    Default bounds: Lat 6.5N to 40.0N, Lon 66.5E to 98.5E
    """
    
    def __init__(self, n_lat: int = 135, n_lon: int = 129, 
                 resolution: float = 0.25, 
                 lat_min: float = 6.5, lon_min: float = 66.5):
        self.n_lat = n_lat
        self.n_lon = n_lon
        self.resolution = resolution
        self.lat_min = lat_min
        self.lon_min = lon_min
        
        self.lat_max = self.lat_min + (self.n_lat - 1) * self.resolution
        self.lon_max = self.lon_min + (self.n_lon - 1) * self.resolution
        
        # 1D coordinate arrays
        self.lats = np.linspace(self.lat_min, self.lat_max, self.n_lat)
        self.lons = np.linspace(self.lon_min, self.lon_max, self.n_lon)
        
        # 2D coordinate grids (useful for fast vectorized operations)
        self.lon_grid, self.lat_grid = np.meshgrid(self.lons, self.lats)
        
        # Internal mapping
        self._id_to_record: Dict[str, GridRecord] = {}
        self._coords_to_id_map: Dict[Tuple[int, int], str] = {}
        
        # KDTree for fast nearest-neighbor spatial lookups
        self._kdtree: Optional[cKDTree] = None
        self._grid_points: list = []
        
        self._initialize_grid()
        
    def _initialize_grid(self):
        """Generates all GridRecords and populates internal maps."""
        points = []
        for i in range(self.n_lat):
            for j in range(self.n_lon):
                grid_id = f"G_{i}_{j}"
                lat = self.lats[i]
                lon = self.lons[j]
                
                record = GridRecord(
                    grid_id=grid_id,
                    lat=float(lat),
                    lon=float(lon),
                    i=i,
                    j=j,
                    is_land=True # Default, updated by masks later
                )
                
                self._id_to_record[grid_id] = record
                self._coords_to_id_map[(i, j)] = grid_id
                points.append((lat, lon))
        
        self._grid_points = points
        self._kdtree = cKDTree(points)

    def get_metadata(self) -> GridMetadata:
        """Returns the complete GridMetadata."""
        return GridMetadata(
            n_lat=self.n_lat,
            n_lon=self.n_lon,
            resolution_deg=self.resolution,
            lat_min=self.lat_min,
            lon_min=self.lon_min,
            total_cells=self.n_lat * self.n_lon,
            cells=list(self._id_to_record.values())
        )

    def id_to_coords(self, grid_id: str) -> Tuple[float, float]:
        """Looks up lat, lon for a given Grid ID."""
        if grid_id not in self._id_to_record:
            raise ValueError(f"Invalid Grid ID: {grid_id}")
        record = self._id_to_record[grid_id]
        return record.lat, record.lon

    def index_to_id(self, i: int, j: int) -> str:
        """Returns Grid ID for given i, j indices."""
        if not (0 <= i < self.n_lat and 0 <= j < self.n_lon):
            raise IndexError("Grid indices out of bounds")
        return self._coords_to_id_map[(i, j)]

    def coords_to_nearest_grid(self, lat: float, lon: float) -> str:
        """
        Finds the nearest stable Grid ID for a given (lat, lon) 
        using O(1) mathematical rounding.
        """
        # Calculate indices using exact math (faster than KDTree for regular grids)
        i = round((lat - self.lat_min) / self.resolution)
        j = round((lon - self.lon_min) / self.resolution)
        
        # Clamp to bounds
        i = max(0, min(self.n_lat - 1, int(i)))
        j = max(0, min(self.n_lon - 1, int(j)))
        
        return self.index_to_id(i, j)

    def coords_to_nearest_kdtree(self, lat: float, lon: float) -> str:
        """
        Alternative spatial lookup using KDTree (useful for irregular inputs).
        """
        if self._kdtree is None:
            raise RuntimeError("KDTree not initialized")
        _, idx = self._kdtree.query([lat, lon])
        
        record = list(self._id_to_record.values())[idx]
        return record.grid_id
