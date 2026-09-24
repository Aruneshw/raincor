from abc import ABC, abstractmethod
from typing import Dict
from grid.engine import SpatialGrid

class IDistrictBoundaryAdapter(ABC):
    """
    Interface for attaching district metadata to grid records.
    Implementations will load real boundary files (e.g., GeoJSON, shapefiles)
    and map them to the grid IDs without needing a model per grid.
    """
    
    @abstractmethod
    def load_boundaries(self, filepath: str) -> None:
        """Loads boundary dataset."""
        pass
        
    @abstractmethod
    def intersect_grid(self, grid: SpatialGrid) -> Dict[str, str]:
        """
        Calculates intersection and returns a mapping of Grid ID -> District ID.
        """
        pass
