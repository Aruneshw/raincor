from abc import ABC, abstractmethod
from typing import Dict
from grid.engine import SpatialGrid

class ITerrainFeatureAdapter(ABC):
    """
    Interface for attaching elevation and terrain metadata to grid records.
    Implementations will load DEM (Digital Elevation Model) datasets.
    """
    
    @abstractmethod
    def load_dem(self, filepath: str) -> None:
        """Loads elevation dataset (e.g., GeoTIFF)."""
        pass
        
    @abstractmethod
    def extract_elevation(self, grid: SpatialGrid) -> Dict[str, float]:
        """
        Extracts elevation at grid centers and returns mapping of Grid ID -> Elevation (m).
        """
        pass
